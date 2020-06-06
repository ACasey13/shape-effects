import numpy as np
import json

def get_path(descriptor, n_h='all', diameter=None, subsample=5):
    """return the CLOSED path from an array of Fourier descriptors.
    can specify the number of harmonics, 'n_h', to keep only the first n
    harmonics on either side of the zeroth harmonic. That is, if n_h=1 keep
    harmonics k=-1,0,+1. can also specify the target diameter (specified in nm)
    to rescale the path.
    """
    desc_size = np.size(descriptor)
    n_harm = int(np.floor(desc_size/2))

    if n_h == 'all':
        n_h = desc_size

    #Reinitialize the Fourier spectrum
    F_shift = np.fft.ifftshift(descriptor)

    #Apply filter
    low = 1+n_h
    high = desc_size-n_h
    if high - low > 0:
        F_shift[low:high] = 0
    descriptor = np.fft.fftshift(F_shift)

    k_vect = np.arange(-n_harm, n_harm+1)
    area_F = np.sum(np.multiply(k_vect,np.square(np.abs(descriptor/desc_size))))*np.pi

    if diameter is None:
        TARGET_AREA = area_F
    else:
        TARGET_AREA = (diameter * 10**-7 / 2)**2 * np.pi

    F_norm_right = descriptor * np.sqrt(TARGET_AREA/area_F)

    # Convert to shape
    c = np.fft.ifft(np.fft.ifftshift(F_norm_right))
    x = np.real(c)[::subsample]
    y = np.imag(c)[::subsample]
    contour = np.vstack([x,y])

    # Complete path such that curve is closed
    path = np.hstack((contour, contour[:,[0]]))*10**4
    path = [{'x': x, 'y': y} for x,y in zip(path[0], path[1])]

    return path

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

def get_perim(x,y, total_only=True):
    """user provides the x, y coordinates of a CLOSED path, and this function
    returns the total perimeter length. If the parameter 'total_only' is set to
    False, then the cumulative perimeter as each point is returned."""

    p = np.hstack((0,np.cumsum(np.sqrt(np.diff(x)**2 + np.diff(y)**2))))
    if total_only:
        return p[-1]
    else:
        return p

def get_desc(path):
    """take an x,y path (NOT CLOSED) and return the Fourier descriptors.
    Path must be size [2, n_pts]
    """
    x = path[0]
    y = path[1]
    c_eqi_par = np.add(x,1j*y)
    Y_c_par = np.fft.fftshift(np.fft.fft(c_eqi_par))
    return Y_c_par

def sep_re_im(X):
    """Given a descriptor, separate into real and imaginary parts
    """
    return np.hstack((np.real(X), np.imag(X)))

def strip_harmonic(descriptor, n_h = None):
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
