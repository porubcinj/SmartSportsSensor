class Classifications:
    def __init__(self):
        self.classes = tuple([
            ("serve", "forehand", spin) for spin in ("flat", "slice", "topspin")
        ] + [
            ("groundstroke", side, spin)
            for side in ("forehand", "backhand")
            for spin in ("flat", "slice", "topspin")
        ] + [
            ("volley", side, "slice") for side in ("forehand", "backhand")
        ] + [
            ("overhead", side, spin)
            for side in ("forehand", "backhand")
            for spin in ("flat", "slice")
        ])
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}
        self._num_sensor_data_entries = 8
        self._num_features = 6
        self._num_steps = 64
        self._steps_before_peak = 36
        self._squared_acceleration_threshold = 20

    @property
    def num_classes(self):
        return len(self.classes)

    @property
    def num_features(self):
        return self._num_features

    @property
    def num_sensor_data_entries(self):
        return self._num_sensor_data_entries

    @property
    def num_steps(self):
        return self._num_steps

    @property
    def steps_before_peak(self):
        return self._steps_before_peak

    @property
    def steps_after_peak(self):
        return self.num_steps - self.steps_before_peak - 1

    @property
    def squared_acceleration_threshold(self):
        return self._squared_acceleration_threshold