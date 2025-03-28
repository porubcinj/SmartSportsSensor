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

    @property
    def num_classes(self):
        return self._num_classes