import xgboost as xgb
from xgboost import XGBRegressor as GBR
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
from joblib import dump

def sep_re_im(X):
    """Given a descriptor, separate into real and imaginary parts
    """
    return np.hstack((np.real(X), np.imag(X)))

def scale_descriptors(descriptors, diameter=300):
    """ provide an array of descriptors and the target shape diameter (in nm)
    and the scaled descriptors will be returned. Assumes an array of
    descriptors.
    """
    if descriptors.ndim == 1:
        descriptors = descriptors.reshape((1, -1))
    num_harm = descriptors.shape[1]
    n_harm = int(np.floor(num_harm/2))

    k_vect = np.arange(-n_harm, n_harm+1)
    TARGET_AREA = (diameter * 10**-7 / 2)**2 * np.pi
    area = np.sum(np.multiply(k_vect,np.square(np.abs(descriptors/num_harm))), axis=1)*np.pi
    descriptors *= np.sqrt(TARGET_AREA/area).reshape((-1,1))
    return descriptors

def loop(f):
    """ A decorator. Some functions are more easily understood when defined
    for a single descriptor. And some may contain function calls which do not
    work on arrays (ie; fftshift). Use a decorator to avoid having to keep
    inserting for loops.
    """
    def loop_array(*arrays, **kwargs):
        res = []
        for element in zip(*arrays):
            res.append(f(*element, **kwargs))
        res = np.array(res)
        return res
    return loop_array

@loop
def strip_harmonics(descriptor, n_h = None):
    """Given a descriptor, strip off all of the harmonics except keep n_h.
    """
    # n_h is number of harmonics to keep
    num_harm = descriptor.size
    n_harm = int(np.floor(num_harm/2))

    if n_h == None:
        n_h = n_harm

    #Reinitialize the Fourier spectrum
    F_shift = np.fft.ifftshift(descriptor)

    #Apply filter
    low = 1+n_h
    high = num_harm-n_h
    if high - low > 0:
        F_shift[low:high] = 0
    descriptor_stripped = np.fft.fftshift(F_shift)[n_harm-n_h : n_harm+n_h+1]

    return descriptor_stripped

datasets = ['300nm', '150nm']

def fit(data):
    print('loading dataset {}...'.format(data))
    X = np.load('../data/desc_{}.npy'.format(data))
    y = np.load('../data/labels_{}.npy'.format(data))

    print('scaling...')
    X = scale_descriptors(X)
    print('stripping....')
    X = strip_harmonics(X, n_h=30)
    print('separating...')
    X = sep_re_im(X)

    X_train, X_test, y_train, y_test = train_test_split(X, y)
    print('shape of training data')
    print(X_train.shape)
    print(y_train.shape)

    train_matrix = xgb.DMatrix(data=X_train, label=y_train)
    test_matrix = xgb.DMatrix(data=X_test, label=y_test)

    print('fitting model...')
    gbr = GBR(objective='reg:squarederror')
    gbr.fit(X_train, y_train, early_stopping_rounds=50,
            eval_metric='rmse',
            eval_set=[[X_test, y_test]],
            verbose=True)

    preds_train = gbr.predict(X_train)
    preds_test = gbr.predict(X_test)

    print('train and test scores')
    print(r2_score(y_train, preds_train))
    print(r2_score(y_test, preds_test))

    dump(gbr, 'xbr_{}.joblib'.format(data))

for data in datasets:
    fit(data)
