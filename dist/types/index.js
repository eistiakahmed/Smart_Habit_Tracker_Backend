"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalStatus = exports.Difficulty = exports.Frequency = void 0;
var Frequency;
(function (Frequency) {
    Frequency["DAILY"] = "DAILY";
    Frequency["WEEKLY"] = "WEEKLY";
    Frequency["CUSTOM"] = "CUSTOM";
})(Frequency || (exports.Frequency = Frequency = {}));
var Difficulty;
(function (Difficulty) {
    Difficulty["EASY"] = "EASY";
    Difficulty["MEDIUM"] = "MEDIUM";
    Difficulty["HARD"] = "HARD";
})(Difficulty || (exports.Difficulty = Difficulty = {}));
var GoalStatus;
(function (GoalStatus) {
    GoalStatus["ACTIVE"] = "ACTIVE";
    GoalStatus["COMPLETED"] = "COMPLETED";
    GoalStatus["FAILED"] = "FAILED";
    GoalStatus["PAUSED"] = "PAUSED";
})(GoalStatus || (exports.GoalStatus = GoalStatus = {}));
//# sourceMappingURL=index.js.map