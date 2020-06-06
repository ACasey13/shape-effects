import os
import pandas as pd
import numpy as np

datasets = ['300nm','150nm']

DATA_DIR = os.path.abspath(os.path.join('..', '..', 'data'))
DESC_FILE = 'aggregate_descriptors.npy'
DF_FILE = 'master_aggregate_df.h5'

for dataset in datasets:
    print('working on dataset {}'.format(dataset))
    descriptors = np.load(os.path.join(DATA_DIR, dataset, DESC_FILE))
    pore_df = pd.read_hdf(os.path.join(DATA_DIR, dataset, DF_FILE))

    processed_pores_df = pore_df[pore_df['status']==5]
    processed_desc = descriptors[processed_pores_df.index]

    print('number of processed pores: {}'.format(len(processed_desc)))

    print('grabing labels...')
    labels = processed_pores_df['critical velocity'].values


    np.save('labels_{}.npy'.format(dataset),
            labels)
    np.save('desc_{}.npy'.format(dataset),
            processed_desc)
