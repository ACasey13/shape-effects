import os
import numpy as np
import GPy
os.environ['KERAS_BACKEND'] = 'theano'
import keras
from joblib import load

rfr_300 = load(os.path.join('models','rfr_300nm.joblib'))
xgb_300 = load(os.path.join('models', 'xbr_300nm.joblib'))
gpr_300 = GPy.models.GPRegression(
                                  np.load(os.path.join('models','gpr_X_300nm.npy')),
                                  np.load(os.path.join('models', 'gpr_y_300nm.npy')),
                                  initialize=False)
gpr_300.update_model(False)
gpr_300.initialize_parameter()
gpr_300[:] = np.load(os.path.join('models', 'gpr_300nm.npy'))
gpr_300.update_model(True)
gpr_300_shift = np.load(os.path.join('models', 'gpr_shift_300nm.npy'))
cnn_300 = keras.models.load_model(os.path.join('models','model.20.hdf5'))
