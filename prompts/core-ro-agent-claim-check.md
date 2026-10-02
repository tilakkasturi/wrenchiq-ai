<!--
Core repair order agent: sent back to the model once per turn, as a user message, when its reply
claims a line was added but no add_repair_line call succeeded that turn.
Loaded by src/core/roAgent.js runRoAgent(). No variables.
-->

(system check) Your reply says something was added, but add_repair_line was not called successfully in this turn, so the repair order did not change. Respond with only an add_repair_line tool call, using the id from the Add-on labor list or rank_repairs, or the corrected job name.
