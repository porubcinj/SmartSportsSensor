class Classifications:
    def __init__(self):
        self.classifications = {
            "stroke": (
                "serve",
                "groundstroke",
                "volley",
                "overhead",
            ),
            "side": (
                "forehand",
                "backhand",
            ),
            "spin": (
                "flat",
                "slice",
                "topspin",
            ),
        }
        self._num_classes: int = sum(len(self.classifications[k]) for k in self.classifications)
        self._num_features = 6
        self._num_shot_steps = 64
        self._shot_steps_before_peak = 36
        self._squared_acceleration_threshold = 20

    @property
    def num_classes(self):
        return self._num_classes

    @property
    def num_features(self):
        return self._num_features

    @property
    def num_shot_steps(self):
        return self._num_shot_steps

    @property
    def shot_steps_before_peak(self):
        return self._shot_steps_before_peak

    @property
    def shot_steps_after_peak(self):
        return self.num_shot_steps - self.shot_steps_before_peak - 1

    @property
    def zscore_steps_before_peak(self):
        return self.num_shot_steps

    @property
    def zscore_steps_after_peak(self):
        return self.num_shot_steps - 1

    @property
    def squared_acceleration_threshold(self):
        return self._squared_acceleration_threshold