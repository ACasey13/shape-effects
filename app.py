# app imports
from flask import Flask, render_template, request
from flask import redirect, flash, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin
from flask_login import current_user, login_user
from flask_login import logout_user, login_required
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.urls import url_parse
from forms import LoginForm
from flask_bootstrap import Bootstrap
# predictive model imports
import os
import numpy as np
import utils
import json
os.environ['KERAS_BACKEND'] = 'theano'

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///main.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'truly_phenomenal_shapes'
db = SQLAlchemy(app)
login = LoginManager(app)
login.login_view = 'user_login'
bootstrap = Bootstrap(app)

models_loaded = False

# print('loading models...')
# from load_models import *
# print('models loaded...')

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), nullable=False, unique=True)
    hashed_password = db.Column(db.String(128), nullable=False)

    def __repr__(self):
        return '<User %r>' % self.username

    def set_password(self, password):
        self.hashed_password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.hashed_password, password)

@login.user_loader
def load_user(id):
    return User.query.get(int(id))

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def user_login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password.')
            return redirect(url_for('user_login'))
        login_user(user, remember=False,)
        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('index')
        return redirect(next_page)
    return render_template('login.html', title='Sign In', form=form)

@app.route('/logout')
def user_logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/explore')
@login_required
def explore():
    return render_template('explore.html', title="Explore")

@app.route('/background')
def background():
    return render_template('background.html', title='Background')

@app.route('/data_repr')
def data():
    return render_template('data.html', title='Data Representation')

@app.route('/models')
def models():
    return render_template('models.html', title='Models')

@app.route('/data', methods=['POST'])
@login_required
def get_pore():
    id = request.form.get('id')
    size = request.form.get('d')
    msg = ''
    if id is not None:
        id = int(id)
        if size=='300':
            if id>=1 and id<=6152:
                pore = np.load(os.path.join('data', 'desc_300nm.npy'))[id-1]
                act = np.load(os.path.join('data', 'labels_300nm.npy'))[id-1]
                path = utils.get_pts(pore, diameter=300,
                               subsample=5)
                set = '(train)'
                labels = ['', '', '', '', str(act)]
            else:
                msg = 'Pore index not valid!'
        elif size=='150':
            if id>=1 and id<=6285:
                pore = np.load(os.path.join('data', 'desc_150nm.npy'))[id-1]
                act = np.load(os.path.join('data', 'labels_150nm.npy'))[id-1]
                path = utils.get_pts(pore, diameter=150,
                               subsample=5)
                set = '(train)'
                labels = ['', '', '', '', str(act)]
            else:
                msg = 'Pore index not valid!'
        else:
            msg = 'Pore size not understood'
    if msg:
        response = app.response_class(
        response=json.dumps({'path':[],
                             'labels': [],
                             'set': [],
                             'msg': msg}),
        status=200,
        mimetype='application/json')
        return response


    response = app.response_class(
    response=json.dumps({'path':path,
                         'labels': labels,
                         'set': set}),
    status=200,
    mimetype='application/json')
    return response

@app.route('/default')
def get_default():
    pore = np.load(os.path.join('data', 'desc_300nm.npy'))[2]
    act = np.load(os.path.join('data', 'labels_300nm.npy'))[2]
    path = utils.get_pts(pore, diameter=300,
                               subsample=5)
    set = '(train)'
    labels = ['', '', '', '', str(act)]
    response = app.response_class(
    response=json.dumps({'path':path,
                         'labels': labels,
                         'set': set}),
    status=200,
    mimetype='application/json')
    return response

@app.route('/pred_default', methods=['POST'])
def pred_default():
    resp = request.json
    x, img = utils.preprocess_input(resp['data'], resp['size'], n_h=30)
    rfr_pred = load_models.rfr_300.predict(x)[0]
    xgb_pred = load_models.xgb_300.predict(x)[0]
    gpr_pred, gpr_var = load_models.gpr_300.predict(x)
    gpr_pred = gpr_pred[0][0] + load_models.gpr_300_shift
    cnn_pred = load_models.cnn_300.predict(img)[0][0]
    response = app.response_class(
    response=json.dumps({'rf': str(rfr_pred)[:2],
                         'xgb': str(xgb_pred)[:2],
                         'gp': str(gpr_pred)[:2],
                         'cnn': str(cnn_pred)[:2],
                         #'cnn': 'tbd',
                         }),
    status=200,
    mimetype='application/json')
    return response

@app.route('/predict', methods=['POST'])
@login_required
def predict():
    resp = request.json
    x, img = utils.preprocess_input(resp['data'], resp['size'], n_h=30)
    print('data has been preprocessed')
    rfr_pred = rfr_300.predict(x)[0]
    print('rf pred: {}'.format(rfr_pred))
    xgb_pred = xgb_300.predict(x)[0]
    print('xgb_pred: {}'.format(xgb_pred))
    gpr_pred, gpr_var = gpr_300.predict(x)
    gpr_pred = gpr_pred[0][0] + gpr_300_shift
    gpr_std = gpr_var[0][0]
    print('gpr_pred: {}'.format(gpr_pred))
    cnn_pred = cnn_300.predict(img)[0][0]
    print('cnn_pred: {}'.format(cnn_pred))
    response = app.response_class(
    response=json.dumps({'rf': str(round(rfr_pred,1)),
                         'xgb': str(round(xgb_pred,1)),
                         'gp': str(round(gpr_pred,1)),
                         'gp_std': str(round(np.sqrt(gpr_std), 1)),
                         'cnn': str(round(cnn_pred,1)),
                         #'cnn': 'tbd',
                         }),
    status=200,
    mimetype='application/json')
    return response

@app.route('/filter', methods=['POST'])
def filter_pore():
    resp = request.json
    n_h = int(resp['n_h'])
    path = np.asarray([[pt['x'], pt['y']] for pt in resp['data']]).T / (10**4)
    perim = utils.get_perim(path[0], path[1], total_only=False)
    path_x = np.interp(np.linspace(0,perim[-1],1024), perim, path[0])
    path_y = np.interp(np.linspace(0,perim[-1],1024), perim, path[1])
    path = np.vstack((path_x, path_y))[:,:-1]
    desc = utils.get_desc(path)
    json_path = json.dumps(utils.get_pts(desc, n_h=n_h))
    response = app.response_class(
    response=json_path,
    status=200,
    mimetype='application/json')
    return response

@app.route('/models_load', methods=['GET'])
def models_load():
    global models_loaded
    if not models_loaded:
        global load_models
        import load_models
        models_loaded = True;
    response = app.response_class(
    response=json.dumps({'status':str(models_loaded)}),
    status=200,
    mimetype='application/json')
    return response

if __name__ == "__main__":
    app.run(debug=False)
