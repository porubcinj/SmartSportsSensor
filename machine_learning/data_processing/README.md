### data directory:
- raw\_sensor\_data -- all data collected from arduino
- stroke\_peaks -- cleaned data with only peaks for each shot type
- stroke\_peak\_data.npz -- peak data converted to np X features and y labels

<br>

### src directory:
- functional\_visualization.ipynb -- modified version of visualization.ipynb to iterate over all raw\_sensor\_data to convert to stroke\_peaks data
- convert\_samples.ipynb -- converts all data in stroke\_peaks to np data for model consumption
