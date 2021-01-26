import numpy as np
import json
import cv2

def get_pts(descriptor, n_h='all', diameter=None, subsample=5):
    """return the CLOSED chart.js style points
    from an array of Fourier descriptors.
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

def get_path(descriptor, n_h='all', diameter=None):
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
    x = np.real(c)
    y = np.imag(c)
    contour = np.vstack([x,y])

    # Complete path such that curve is closed
    path = np.hstack((contour, contour[:,[0]]))

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

def get_area_and_centroid(path):
    """green's theorem
    https://leancrew.com/all-this/2018/01/greens-theorem-and-section-properties/
    """
    s = 0
    sx = 0
    sy = 0
    for i in range(path.shape[1]-1):
        factor = path[0][i]*path[1][i+1] - path[0][i+1]*path[1][i]
        s += factor;
        sx += ((path[0][i] + path[0][i+1]) * factor);
        sy += ((path[1][i] + path[1][i+1]) * factor);

    area = s/2
    return area, sx/(6*area), sy/(6*area)

def fix_starting_loc(path):
    """ok, most of this code comes from likes 551-690 in
    Jesus' get_pore_data.py module. Honestly, I think it could be
    re-done to use only half of the lines but I'm not going to break
    something that is working.
    However, I'm not using the "check for
    unique points" portion. The added for loops and zipping and unzipping
    is super redundant. The duplicate points case will only result in the
    path already being closed. So it can be accounted for by not adding a
    closure point.

    The only other things to keep in mind is that the incoming path should
    be CLOSED. The operations work on OPEN paths so the first thing this
    function does is drop the last point."""

    # get centroid information
    # this code depends on the shape being centered
    area, xc, yc = get_area_and_centroid(path)

    # make path open instead of closed
    path = path[:,:-1]

    #Unpack the perimeter path information and normalize the coordiantes to the
    # void centroid location.
    x_perim = path[0]-xc
    y_perim = path[1]-yc

    #Locate the right-most point (most positive x-position) along the contour.
    rm_path_ind = np.where(x_perim==x_perim.max())[0][0]
    #print(rm_path_ind)

    #Determine if the x_axis crossing is in the clockwise (-1) or
    # counter-clockwise (1) direction.  This is achieved by noting if the
    # right-most point is above or below the axis.  As the centroid of the void
    # is shifted to (0,0), this approach is robust. Also, detect if the
    # right-most point is coincidently the x-axis crossing point
    closed = False
    if y_perim[rm_path_ind] == 0:

        #Set the right-most point as the crossing point
        x_par_start = x_perim[rm_path_ind]

        #Set the index of the nearest y-positive path point as the index of x_0
        x_0_index = rm_path_ind + 1

        # oh Jesus... we need to fix above, what if it is the last point?!?!
        # this should do the trick
        x_0_index = x_0_index % x_perim.size

        closed = True

    elif y_perim[rm_path_ind] > 0:

        #Starting at the right-most point, find the point where the perimeter
        # path crosses the x-axis in the counter-clockwise direction, even if
        # this point is between two points along the perimeter path. To
        # accomplish this, create a shifted perimeter path starting at the
        # location of the right-most point along the determined direction to
        # the x-axis.

        #Create a variable to hold the shifted path
        x_shift_path = np.zeros(np.shape(x_perim))
        y_shift_path = np.zeros(np.shape(y_perim))

        #Populate the shifted path variables
        x_shift_path[0:rm_path_ind+1] = np.flipud(x_perim[:rm_path_ind+1])
        x_shift_path[rm_path_ind+1:] = np.flipud(x_perim[rm_path_ind+1:])
        y_shift_path[0:rm_path_ind+1] = np.flipud(y_perim[:rm_path_ind+1])
        y_shift_path[rm_path_ind+1:] = np.flipud(y_perim[rm_path_ind+1:])

        #Locate the index of the path points on either side of the x-axis
        start_ind_1 = np.where(y_shift_path<0)[0][0]
        start_ind_0 = start_ind_1-1
        #print(start_ind_1)

        #Determine the locations of the points on either side of the x-axis
        x_0 = x_shift_path[start_ind_0]
        y_0 = y_shift_path[start_ind_0]
        x_1 = x_shift_path[start_ind_1]
        y_1 = y_shift_path[start_ind_1]

        #Determine the cross point along the x-axis by finding where the line
        # from the path points on either side of the x-axis intersects the
        # x-axis. If the line is vertical, then the x-location of the crossing
        # is the same as the x-location of the neighboring path points
        if x_0 == x_1:
            x_par_start = x_0

        #If not, find the x-location of the crossing by geometry
        else:
            x_par_start = -(y_0 - x_0 * ((y_1-y_0)/(x_1-x_0)))/((y_1-y_0)/(x_1-x_0))

        #Find the index of the x_0/y_0 point from the perimeter path where the
        # x_0/y_0 point corresponds to the nearest y-positive path point to the
        # x-axis cross point.

        # another alex fix to not have to check for unique points.
        if y_shift_path[start_ind_0] == 0:
            start_ind_0 -= 1
            # note, cannot go negative because this case would have triggered
            # the first if statement
            closed = True

        # I (alex) added the arange call. It's ugly but it fixes a
        # failure point in Jesus' code where rm_path_ind - start_ind_0
        # can represent a negative index.
        x_0_index = np.arange(x_perim.size)[rm_path_ind - start_ind_0]

    else:

        #Starting at the right-most point, find the point where the perimeter
        # path crosses the x-axis in the clockwise direction, even if this
        # point is between two points along the perimeter path. To accomplish
        # this, create a shifted perimeter path starting at the location of the
        # right-most point along the determined direction to the x-axis.

        #Create a variable to hold the shifted path
        x_shift_path = np.zeros(np.shape(x_perim))
        y_shift_path = np.zeros(np.shape(y_perim))

        #Determine the remaining number of points along the perimeter path past
        # the right-most point
        N_pastrm = np.size(x_perim)-rm_path_ind

        #Populate the shifted path variables
        x_shift_path[0:N_pastrm] = x_perim[rm_path_ind:]
        x_shift_path[N_pastrm:] = x_perim[0:rm_path_ind]
        y_shift_path[0:N_pastrm] = y_perim[rm_path_ind:]
        y_shift_path[N_pastrm:] = y_perim[0:rm_path_ind]

        #Locate the index of the path points on either side of the x-axis
        start_ind_1 = np.where(y_shift_path>0)[0][0]
        start_ind_0 = start_ind_1-1

        #Determine the locations of the points on either side of the x-axis
        x_0 = x_shift_path[start_ind_0]
        y_0 = y_shift_path[start_ind_0]
        x_1 = x_shift_path[start_ind_1]
        y_1 = y_shift_path[start_ind_1]

        #Determine the cross point along the x-axis by finding where the line
        # from the path points on either side of the x-axis intersects the
        # x-axis

        #If the line is vertical, then the x-location of the crossing is the
        # same as the x-location of the neighboring path points
        if x_0 == x_1:
            x_par_start = x_0
        else:
            x_par_start = -(y_0 - x_0 * ((y_1-y_0)/(x_1-x_0)))/((y_1-y_0)/(x_1-x_0))

        # another alex fix to not have to check for unique points.
        if y_shift_path[start_ind_0] == 0:
            closed = True

        #Find the index of the x_0/y_0 point from the perimeter path where the
        # x_0/y_0 point corresponds to the nearest y-positive path point to the
        # x-axis cross point.
        # another alex fix to account for if it is the last point
        x_0_index = (rm_path_ind + start_ind_1) % x_perim.size

    #Create a parameterized perimeter path starting at the right-most
    # crossing point of the x-axis (x_start,y_start) along the perimeter
    # path and ends at the starting point ot form a closed contour.

    #The y-location of the crossing is, by definition, zero.
    y_par_start = 0

    #Determine how many points are from the x_0/y_0 point to the last point
    # in the perimeter path
    N_backpoints = np.size(x_perim)-x_0_index

    #Create a variable to hold the parameterized path
    x_par = np.zeros(np.size(x_perim)+1)
    y_par = np.zeros(np.size(y_perim)+1)

    #Populate the parameterized path variables
    x_par[0] = x_par_start
    x_par[1:N_backpoints+1] = x_perim[x_0_index:]
    x_par[N_backpoints+1:] = x_perim[:x_0_index]
    y_par[0] = y_par_start
    y_par[1:N_backpoints+1] = y_perim[x_0_index:]
    y_par[N_backpoints+1:] = y_perim[:x_0_index]

    path = np.vstack((x_par, y_par))

    if not closed:
        path = np.hstack((path, path[:,[0]]))

    return path

def pts_to_path(pts):
    return np.asarray([[pt['x'], pt['y']] for pt in pts]).T / (10**4)

def resample(path):
    perim = get_perim(path[0], path[1], total_only=False)
    path_x = np.interp(np.linspace(0,perim[-1],1024), perim, path[0])
    path_y = np.interp(np.linspace(0,perim[-1],1024), perim, path[1])
    path = np.vstack((path_x, path_y))
    return path

def preprocess_input(data, size, n_h=30):
    path = pts_to_path(data)
    path = fix_starting_loc(path)
    path = resample(path)
    desc = get_desc(path[:,:-1])
    desc = strip_harmonics(desc, n_h=n_h)
    desc = sep_re_im(desc)
    discrete_shape = fill_contours(path, size=size, fill=False)
    return desc.reshape((1,-1)), (discrete_shape/255)[np.newaxis,:,:,np.newaxis]

def fill_contours(path, size, discretization=128,
                 padding=2, square_pixel=True, fill=True,
                 thickness=1):
    """
    Accepts the shape path and returns
    array of the shape as an image
    (image size: dicretization X discretization) with the
    inside of the contour filled with the value 255,
    0 otherwise.
    Note: images are returned with their origin set to upper!
    See pyplot imshow origin for more details.

    Parameters
    ----------
    path : array
        shape path
    discretization : integer, optional
        The number of pixels on an axis. The default is 128.
    size : mean pore diameter
    padding : int, optional
        Number of pixels to add as a border. The default is 2.
    square_pixel : boolean, optional
        Whether or not to keep the x and y width of the pixel
        the same (that is, force a square pixel or let the
                  pixel be rectangular). The default is True.
    fill: boolean, optional
        if true, the contours will be filled, otherwise only
        the shape outline will be drawn.
    thickness: int, optional
        thickness of the shape outline to be drawn. Ignored if fill = True.
        Default is 1.

    Returns
    -------
    array
        The shape images. shape: (num_descriptors, discretization, discretization)

    """
    e = [1.790438802777571947e-05 * 2,
         3.472830731025012679e-05 * 2];
    if fill:
        thickness = -1

    if int(size) == 300:
        extent = e[1]
    elif int(size) == 150:
        extent = e[0]
    else:
        raise ValueError('extent size not valid')

    x_mi = -extent/2
    y_mi = -extent/2

    path[0] = (path[0]-x_mi) / (extent) * (discretization-2*padding) + padding
    #path_0 = [np.round(pt)-1 if pt>=0 else np.round(pt) for pt in path[0]]
    path[1] = (path[1]-y_mi) / (extent) * (discretization-2*padding) + padding
    #path_1 = [np.round(pt)-1 if pt>=0 else np.round(pt) for pt in path[1]]
    path = np.array([path[0], path[1]], dtype=np.int).T

    # arbitrary shapes may exceed extent. This accounts for that.
    path[path>discretization-1] = (discretization-1)
    path[path<0] = 0

    path = np.expand_dims(path, 1)

    img = np.zeros((discretization, discretization))
    img = cv2.drawContours(img, [path], -1, color=(255,0,0),
                           thickness=thickness)

    return img
