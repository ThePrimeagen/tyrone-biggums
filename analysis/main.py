import pandas as pd
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

pd.set_option('display.max_colwidth', None)

def reduce_data_set(dist):
    if os.environ.get("REDUCE_DATA_BY_STD"):
        dist_mean = dist.duration.mean()
        dist_std = dist.duration.std()
        dist = dist[dist.duration <= dist_mean + dist_std * int(os.environ.get("REDUCE_DATA_BY_STD"))]

    return dist

def create_histogram(dist, name, col):
    dist = reduce_data_set(dist)

    dist.hist(bins=50, column=col);
    plt.title(f'{name}')
    plt.savefig(f'./images/{name}.png')

def create_histograms(pf):
    names = pf.name.unique()
    print(names)
    for name in names:
        print(f'creating {name}')

        # global coms.. scares
        dist = pf[(pf.name == name)]
        create_histogram(dist, name, "duration")


pf = pd.read_csv(os.environ.get("FILE"))
pf.columns = [
    "type",
    "duration",
]

pf = reduce_data_set(pf)
grouped = pf.groupby(['type'])
print(grouped.describe())
