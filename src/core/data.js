// Sample data for the Core assistant prototype: shop-profile questions, labor guide,
// maintenance schedule and follow-up question bank. All of it is made up for the demo.

export const PQ = [
  { key: 'shop.labor_rate', label: 'Labor rate', ask: "What's your standard labor rate per hour?", why: 'I multiply labor-guide hours by it to price labor on the repair order.', hint: 'Give me a number, like 145, or say "145 an hour".', type: 'number', min: 10, max: 1000, fmt: v => '$' + v + '/hr' },
  { key: 'shop.diag_rate', label: 'Diagnostic rate', ask: 'Do you charge a different rate for diagnostic time? Say "same" if not.', why: 'Diagnostic hours are often billed apart from repair labor.', hint: 'Give me a number, or say "same".', type: 'number', min: 10, max: 1000, fmt: v => '$' + v + '/hr' },
  { key: 'parts.tier', label: 'Parts preference', ask: 'Which parts do you prefer to quote?', why: 'I list this tier first when I show parts for a repair.', hint: 'OEM, aftermarket (premium or economy), or "depends".', type: 'choice', options: ['OEM', 'Aftermarket, premium', 'Aftermarket, economy', 'Depends on the job'] },
  { key: 'parts.markup', label: 'Parts markup', ask: "What's your typical parts markup?", why: 'Used to shape parts pricing once part costs are connected.', hint: 'Give me a percentage, like 40.', type: 'number', min: 0, max: 500, fmt: v => v + '%' },
  { key: 'comms.tone', label: 'Message tone', ask: 'How should messages to your customers sound?', why: 'I write customer messages in this voice.', hint: 'Friendly, formal, or short and direct.', type: 'choice', options: ['Friendly and plain', 'Formal', 'Short and direct'] },
  { key: 'comms.languages', label: 'Customer languages', ask: 'Which languages do your customers use?', why: 'I offer translations for these.', hint: 'Name them, like "English and Spanish".', type: 'multi', options: ['English', 'Spanish', 'Vietnamese', 'Chinese', 'Other'] },
  { key: 'upsell.not_offered', label: 'Services you never offer', ask: 'Are there services you never offer?', why: 'I drop these from suggestions so you never see them.', hint: 'Name them, or say "none".', type: 'multi', options: ['Tires', 'Transmission rebuild', 'Body work', 'A/C service', 'Alignment', 'Diesel', 'None'] },
];
export const PQMAP = Object.fromEntries(PQ.map(q => [q.key, q]));

export const REP = [
  { id: 'brk-front', name: 'Front brake pads and rotors, replace', hours: 1.8, row: 'LG-BRK-F-0142', strong: ['grinding', 'braking', 'brake'], kw: ['stopping', 'pedal'], parts: ['Front brake pads (set)', 'Front brake rotors (2)', 'Brake hardware kit'] },
  { id: 'brk-rear', name: 'Rear brake pads, replace', hours: 1.4, row: 'LG-BRK-R-0157', strong: ['braking', 'brake'], kw: ['grinding', 'stopping'], parts: ['Rear brake pads (set)', 'Brake hardware kit'] },
  { id: 'caliper', name: 'Brake caliper, replace (one side)', hours: 1.2, row: 'LG-BRK-C-0171', strong: [], kw: ['pulling', 'drag', 'burning smell', 'brake'], parts: ['Brake caliper', 'Brake hose washers'] },
  { id: 'strut', name: 'Front struts, replace (pair)', hours: 2.6, row: 'LG-SUS-S-0233', strong: [], kw: ['clunk', 'knock', 'bump', 'rattle', 'suspension', 'bouncy', 'noise'], parts: ['Front strut assemblies (2)', 'Strut mounts (2)'] },
  { id: 'sway', name: 'Sway bar end links, replace (pair)', hours: 0.9, row: 'LG-SUS-L-0241', strong: [], kw: ['clunk', 'rattle', 'knock', 'bump', 'noise'], parts: ['Sway bar end links (2)'] },
  { id: 'bearing', name: 'Wheel bearing, replace (one side)', hours: 1.7, row: 'LG-SUS-B-0258', strong: [], kw: ['humming', 'hum', 'growl', 'roar', 'whine', 'noise', 'grinding'], parts: ['Wheel bearing hub assembly'] },
  { id: 'coil', name: 'Ignition coil, replace', hours: 0.6, row: 'LG-ENG-I-0311', strong: ['misfire'], kw: ['check engine', 'engine light', 'rough', 'hesitat', 'stall', 'idle'], parts: ['Ignition coil'] },
  { id: 'plugs', name: 'Spark plugs, replace', hours: 1.0, row: 'LG-ENG-P-0322', strong: [], kw: ['check engine', 'engine light', 'misfire', 'rough', 'hesitat', 'idle', 'fuel economy'], parts: ['Spark plugs (set)'] },
  { id: 'o2', name: 'Oxygen sensor, replace (upstream)', hours: 0.8, row: 'LG-EMS-O-0344', strong: [], kw: ['check engine', 'engine light', 'fuel economy', 'emission'], parts: ['Oxygen sensor'] },
  { id: 'evap', name: 'EVAP purge valve, replace', hours: 0.5, row: 'LG-EMS-E-0352', strong: [], kw: ['check engine', 'engine light', 'gas cap', 'fuel smell'], parts: ['EVAP purge valve'] },
  { id: 'thermo', name: 'Thermostat, replace', hours: 1.2, row: 'LG-COO-T-0411', strong: ['overheat', 'running hot'], kw: ['temperature', 'heater', 'coolant'], parts: ['Thermostat and housing', 'Coolant'] },
  { id: 'pump', name: 'Water pump, replace', hours: 2.8, row: 'LG-COO-W-0424', strong: [], kw: ['overheat', 'coolant', 'leak', 'whine', 'temperature'], parts: ['Water pump', 'Gasket', 'Coolant'] },
  { id: 'hose', name: 'Radiator hose, replace (upper)', hours: 0.9, row: 'LG-COO-H-0433', strong: [], kw: ['coolant', 'leak', 'overheat', 'steam'], parts: ['Upper radiator hose', 'Coolant'] },
  { id: 'battery', name: 'Battery, replace', hours: 0.4, row: 'LG-ELE-B-0511', strong: ['battery', 'slow crank'], kw: ["won't start", 'no start', 'dead', 'click', 'crank'], parts: ['Battery'] },
  { id: 'starter', name: 'Starter, replace', hours: 1.6, row: 'LG-ELE-S-0522', strong: [], kw: ["won't start", 'no start', 'click', 'crank', 'starter'], parts: ['Starter motor'] },
  { id: 'alt', name: 'Alternator, replace', hours: 1.5, row: 'LG-ELE-A-0533', strong: [], kw: ['battery', 'dead', 'warning light', 'dim', 'charging'], parts: ['Alternator', 'Serpentine belt'] },
  { id: 'acrecharge', name: 'A/C evacuate and recharge', hours: 0.9, row: 'LG-HVA-R-0611', strong: ['not cold', 'warm air'], kw: ['a/c', 'air conditioning'], parts: ['Refrigerant', 'Compressor oil'] },
  { id: 'accomp', name: 'A/C compressor, replace', hours: 2.4, row: 'LG-HVA-C-0624', strong: [], kw: ['a/c', 'air conditioning', 'not cold', 'compressor', 'noise'], parts: ['A/C compressor', 'Receiver drier', 'Refrigerant'] },
  { id: 'balance', name: 'Tire balance, four wheels', hours: 0.6, row: 'LG-TIR-B-0711', strong: [], kw: ['vibration', 'shake', 'steering wheel', 'highway', 'shimmy', 'wobble'], parts: ['Wheel weights'] },
  { id: 'align', name: 'Wheel alignment, four wheel', hours: 1.0, row: 'LG-TIR-A-0722', strong: [], kw: ['pull', 'drift', 'vibration', 'shake', 'steering', 'uneven'], parts: [] },
  { id: 'valvecover', name: 'Valve cover gasket, replace', hours: 2.0, row: 'LG-ENG-V-0811', strong: [], kw: ['oil leak', 'leak', 'oil smell', 'burning smell', 'drip'], parts: ['Valve cover gasket set'] },
  { id: 'oilpan', name: 'Oil pan gasket, replace', hours: 2.4, row: 'LG-ENG-O-0824', strong: [], kw: ['oil leak', 'leak', 'drip', 'puddle'], parts: ['Oil pan gasket', 'Engine oil'] },
  // ---- Brakes: squeaking, soft pedal, noise ----
  { id: 'brk-pads-f', name: 'Front brake pads, replace (pads only)', hours: 1.1, row: 'LG-BRK-F-0140', strong: ['squeak', 'squeal', 'screech'], kw: ['brake', 'braking', 'stopping'], parts: ['Front brake pads (set)', 'Brake hardware kit'] },
  { id: 'brk-service', name: 'Brake service: clean, lubricate and adjust', hours: 0.8, row: 'LG-BRK-S-0133', strong: ['squeak', 'squeal'], kw: ['brake', 'braking', 'noise', 'dust'], parts: [] },
  { id: 'brk-rear-rot', name: 'Rear brake pads and rotors, replace', hours: 1.9, row: 'LG-BRK-R-0159', strong: [], kw: ['grinding', 'brake', 'pulsing', 'vibration'], parts: ['Rear brake pads (set)', 'Rear brake rotors (2)'] },
  { id: 'brk-hose', name: 'Brake hose, replace (one)', hours: 0.9, row: 'LG-BRK-H-0182', strong: [], kw: ['pulling', 'drag', 'soft pedal', 'brake fluid', 'leak'], parts: ['Brake hose'] },
  { id: 'brk-master', name: 'Brake master cylinder, replace and bleed', hours: 1.8, row: 'LG-BRK-M-0195', strong: ['soft pedal', 'spongy', 'pedal sinks'], kw: ['brake fluid', 'pedal', 'brake'], parts: ['Brake master cylinder', 'Brake fluid'] },
  { id: 'diag-brake', name: 'Brake inspection and road test', hours: 0.5, row: 'LG-DGN-B-0101', strong: [], kw: ['brake', 'braking', 'squeak', 'squeal', 'grinding', 'pedal'], parts: [] },
  // ---- Engine not working, no start, stalling, rough running ----
  { id: 'diag-engine', name: 'Diagnostic: engine no-start or driveability concern', hours: 1.0, row: 'LG-DGN-E-0110', strong: ["won't start", 'no start', 'engine not working', "engine isn't working", 'engine problem', 'stalls', 'stalling', 'stalled', 'engine dies', 'cuts out', "won't run", 'runs rough', 'loses power'], kw: ['crank', 'hesitat', 'idle'], parts: [] },
  { id: 'fuelpump', name: 'Fuel pump, replace (in-tank)', hours: 2.8, row: 'LG-FUE-P-0415', strong: ['cranks but'], kw: ["won't start", 'no start', 'stalls', 'stalling', 'loses power', 'hesitat', 'whine'], parts: ['Fuel pump'] },
  { id: 'fuelfilt', name: 'Fuel filter, replace', hours: 0.7, row: 'LG-FUE-F-0408', strong: [], kw: ['hesitat', 'loses power', 'cranks but', 'rough', 'stalls'], parts: ['Fuel filter'] },
  { id: 'crk-sensor', name: 'Crankshaft position sensor, replace', hours: 0.9, row: 'LG-ENG-C-0338', strong: [], kw: ['cranks but', 'stalls', 'stalling', "won't start", 'no start', 'check engine', 'intermittent'], parts: ['Crankshaft position sensor'] },
  { id: 'cam-sensor', name: 'Camshaft position sensor, replace', hours: 0.7, row: 'LG-ENG-M-0341', strong: [], kw: ['check engine', 'rough', 'stalls', 'hard start', 'hesitat'], parts: ['Camshaft position sensor'] },
  { id: 'maf', name: 'Mass air flow sensor, replace', hours: 0.5, row: 'LG-ENG-A-0347', strong: [], kw: ['check engine', 'engine light', 'hesitat', 'rough', 'stalls', 'fuel economy', 'loses power'], parts: ['Mass air flow sensor'] },
  { id: 'throttle', name: 'Throttle body, clean and relearn', hours: 0.8, row: 'LG-ENG-T-0359', strong: [], kw: ['rough idle', 'idle', 'stalls', 'hesitat', 'check engine'], parts: [] },
  { id: 'injector', name: 'Fuel injector, replace (one)', hours: 1.4, row: 'LG-FUE-I-0421', strong: [], kw: ['misfire', 'rough', 'check engine', 'fuel smell', 'hesitat'], parts: ['Fuel injector'] },
  { id: 'vacleak', name: 'Intake vacuum leak, find and repair', hours: 1.5, row: 'LG-ENG-L-0366', strong: ['hissing'], kw: ['rough idle', 'idle', 'check engine', 'stalls', 'high idle'], parts: [] },
  { id: 'ignswitch', name: 'Ignition switch, replace', hours: 1.5, row: 'LG-ELE-W-0541', strong: [], kw: ["won't start", 'no crank', 'key', 'dash lights', 'stalls'], parts: ['Ignition switch'] },
  { id: 'battcable', name: 'Battery cable end, clean or replace', hours: 0.5, row: 'LG-ELE-C-0515', strong: ['corrosion'], kw: ["won't start", 'click', 'dim', 'no crank', 'slow crank'], parts: ['Battery cable'] },
  // ---- Check engine light ----
  { id: 'diag-cel', name: 'Diagnostic: scan codes and test (check engine light)', hours: 0.8, row: 'LG-DGN-C-0105', strong: ['check engine', 'engine light'], kw: [], parts: [] },
  { id: 'cat', name: 'Catalytic converter, replace', hours: 1.8, row: 'LG-EMS-C-0361', strong: ['p0420', 'catalytic'], kw: ['check engine', 'rotten egg', 'sulfur', 'rattle', 'fuel economy'], parts: ['Catalytic converter'] },
  { id: 'egr', name: 'EGR valve, replace', hours: 1.5, row: 'LG-EMS-R-0372', strong: [], kw: ['check engine', 'rough idle', 'hesitat', 'pinging'], parts: ['EGR valve'] },
  { id: 'gascap', name: 'Gas cap, replace', hours: 0.1, row: 'LG-EMS-G-0300', strong: ['gas cap'], kw: ['check engine', 'fuel smell'], parts: ['Gas cap'] },
  // ---- Cooling ----
  { id: 'radiator', name: 'Radiator, replace', hours: 2.5, row: 'LG-COO-R-0446', strong: [], kw: ['overheat', 'coolant', 'leak', 'steam', 'temperature'], parts: ['Radiator', 'Coolant'] },
  { id: 'coolfan', name: 'Radiator cooling fan motor, replace', hours: 1.6, row: 'LG-COO-F-0452', strong: [], kw: ['overheat', 'temperature', 'fan', 'a/c', 'idle'], parts: ['Radiator cooling fan'] },
  // ---- A/C and heater not working ----
  { id: 'diag-ac', name: 'Diagnostic: A/C performance test and leak check', hours: 0.8, row: 'LG-DGN-A-0120', strong: ['a/c not working', 'a/c stopped', 'no a/c'], kw: ['a/c', 'air conditioning', 'not cold', 'warm air', 'hot air', 'no cold air'], parts: [] },
  { id: 'ac-leak', name: 'A/C leak test (dye) and repair estimate', hours: 0.6, row: 'LG-HVA-L-0618', strong: [], kw: ['a/c', 'air conditioning', 'not cold', 'warm air', 'no cold air', 'hissing'], parts: ['Refrigerant'] },
  { id: 'ac-cond', name: 'A/C condenser, replace', hours: 2.2, row: 'LG-HVA-D-0631', strong: [], kw: ['a/c', 'air conditioning', 'not cold', 'warm air', 'leak'], parts: ['A/C condenser', 'Refrigerant'] },
  { id: 'ac-clutch', name: 'A/C compressor clutch, replace', hours: 1.5, row: 'LG-HVA-K-0640', strong: ['clutch'], kw: ['a/c', 'air conditioning', 'click', 'not cold', 'noise'], parts: ['A/C compressor clutch'] },
  { id: 'ac-exp', name: 'A/C expansion valve, replace', hours: 2.0, row: 'LG-HVA-X-0652', strong: [], kw: ['a/c', 'air conditioning', 'not cold', 'warm air', 'frost'], parts: ['A/C expansion valve', 'Receiver drier', 'Refrigerant'] },
  { id: 'ac-switch', name: 'A/C pressure switch, replace', hours: 0.5, row: 'LG-HVA-S-0660', strong: [], kw: ['a/c', 'air conditioning', 'clutch', 'not cold', 'intermittent'], parts: ['A/C pressure switch'] },
  { id: 'blower', name: 'Blower motor, replace', hours: 1.0, row: 'LG-HVA-B-0671', strong: ['no air', 'weak airflow', 'blower', 'no airflow', 'fan not working'], kw: ['a/c', 'air conditioning', 'vents', 'heater', 'fan speed', 'noise'], parts: ['Blower motor'] },
  { id: 'blower-res', name: 'Blower motor resistor, replace', hours: 0.5, row: 'LG-HVA-R-0679', strong: ['only high', 'fan speed'], kw: ['blower', 'no air', 'weak airflow', 'vents'], parts: ['Blower motor resistor'] },
  { id: 'cabin-filt', name: 'Cabin air filter, replace', hours: 0.3, row: 'LG-HVA-F-0685', strong: [], kw: ['weak airflow', 'musty', 'smell', 'vents', 'dust', 'a/c'], parts: ['Cabin air filter'] },
  { id: 'hvac-act', name: 'HVAC blend door actuator, replace', hours: 1.6, row: 'LG-HVA-T-0693', strong: [], kw: ['clicking', 'temperature', 'hot on one side', 'vents', 'heater', 'a/c', 'stuck'], parts: ['HVAC blend door actuator'] },
];
export const REPMAP = Object.fromEntries(REP.map(r => [r.id, {
  id: r.id, name: r.name, hours: r.hours, src: 'lg', ref: r.row, parts: r.parts,
  detail: 'Sample labor guide row (demo data, not a published guide). Operation: ' + r.name + '. Labor time: ' + r.hours.toFixed(1) + ' h.',
}]));

export const MI = [
  { id: 'sm-oil', name: 'Engine oil and filter change', hours: 0.5, every: 15, row: 'SM-OIL-15' },
  { id: 'sm-rot', name: 'Tire rotation', hours: 0.3, every: 15, row: 'SM-ROT-15' },
  { id: 'sm-cab', name: 'Cabin air filter, replace', hours: 0.3, every: 30, row: 'SM-CAB-30' },
  { id: 'sm-air', name: 'Engine air filter, replace', hours: 0.2, every: 30, row: 'SM-AIR-30' },
  { id: 'sm-brk', name: 'Brake system inspection', hours: 0.4, every: 30, row: 'SM-BRK-30' },
  { id: 'sm-plug', name: 'Spark plugs, replace', hours: 1.0, every: 60, row: 'SM-PLG-60' },
  { id: 'sm-bfl', name: 'Brake fluid flush', hours: 0.6, every: 60, row: 'SM-BFL-60' },
  { id: 'sm-clt', name: 'Coolant service', hours: 0.8, every: 60, row: 'SM-CLT-60' },
  { id: 'sm-atf', name: 'Transmission fluid service', hours: 1.0, every: 90, row: 'SM-ATF-90' },
];
export const MAINTMAP = Object.fromEntries(MI.map(m => [m.id, {
  id: m.id, name: m.name, hours: m.hours, src: 'sm', ref: m.row, parts: [],
  detail: 'Scheduled maintenance, sample interval table. Service: ' + m.name + '. Repeats every ' + (m.every * 1000).toLocaleString() + ' mi. Labor time: ' + m.hours.toFixed(1) + ' h.',
}]));

export const QB = [
  { id: 'brk-where', short: 'Location', when: ['brake', 'braking', 'grinding', 'squeal', 'stopping', 'pedal'], ask: 'Where do you hear or feel it, front or rear?', opts: [{ l: 'Front', b: { 'brk-front': 3 } }, { l: 'Rear', b: { 'brk-rear': 3 } }, { l: 'Not sure', b: { 'brk-front': 1, 'brk-rear': 1 } }] },
  { id: 'brk-sound', short: 'Sound', when: ['brake', 'braking', 'grinding', 'squeal', 'squeak', 'pedal'], ask: 'What does it sound or feel like?', opts: [{ l: 'Grinding', b: { 'brk-front': 3, 'brk-rear': 2 } }, { l: 'Squeal', b: { 'brk-front': 2, 'brk-rear': 2 } }, { l: 'Pedal pulses', b: { 'brk-front': 3 } }, { l: 'Clunk', b: { caliper: 3 } }] },
  { id: 'noise-when', short: 'When', when: ['noise', 'clunk', 'knock', 'rattle', 'bump', 'hum', 'growl'], ask: 'When does the noise happen?', opts: [{ l: 'Over bumps', b: { strut: 3, sway: 3 } }, { l: 'When turning', b: { bearing: 3 } }, { l: 'Constant while driving', b: { bearing: 3 } }, { l: 'Only when braking', b: { 'brk-front': 2 } }] },
  { id: 'cel-flash', short: 'Warning light', when: ['check engine', 'engine light', 'misfire'], ask: 'Is the warning light flashing or steady?', opts: [{ l: 'Flashing', b: { coil: 3, plugs: 3 } }, { l: 'Steady', b: { o2: 2, evap: 2 } }] },
  { id: 'rough', short: 'Idle', when: ['check engine', 'engine light', 'misfire', 'rough', 'hesitat', 'idle'], ask: 'Any rough idle or hesitation?', opts: [{ l: 'Yes', b: { coil: 2, plugs: 2 } }, { l: 'No', b: { o2: 1, evap: 1 } }] },
  { id: 'coolant', short: 'Coolant', when: ['overheat', 'running hot', 'temperature', 'coolant', 'steam'], ask: 'Any coolant leak or low level?', opts: [{ l: 'Yes', b: { pump: 2, hose: 3 } }, { l: 'No', b: { thermo: 3 } }] },
  { id: 'crank', short: 'Key turn', unless: ['a/c', 'air conditioning'], when: ["won't start", 'no start', 'dead', 'crank', 'click', 'battery'], ask: 'What happens when you turn the key?', opts: [{ l: 'Nothing at all', b: { battery: 3, alt: 1 } }, { l: 'Clicking', b: { starter: 2, battery: 2 } }, { l: 'Slow crank', b: { battery: 3 } }] },
  { id: 'acq', short: 'A/C', when: ['a/c', 'air conditioning', 'not cold', 'warm air'], ask: 'How does the A/C behave?', opts: [{ l: 'Blows but never gets cold', b: { acrecharge: 3, accomp: 1 } }, { l: 'Cold at first, then warm', b: { accomp: 3 } }] },
  { id: 'vib', short: 'Shake', when: ['vibration', 'shake', 'shimmy', 'wobble'], ask: 'When does it shake?', opts: [{ l: 'Highway speeds', b: { balance: 3, align: 1 } }, { l: 'Only when braking', b: { 'brk-front': 3 } }, { l: 'All the time', b: { align: 2, bearing: 2 } }] },
  { id: 'leak', short: 'Leak', when: ['leak', 'drip', 'puddle', 'oil smell'], ask: 'Where is the leak?', opts: [{ l: 'Top of engine', b: { valvecover: 3 } }, { l: 'Under the engine', b: { oilpan: 3 } }] },
  { id: 'brk-when', short: 'Squeak timing', when: ['squeak', 'squeal', 'screech'], ask: 'When does the brake squeak happen?', opts: [{ l: 'Only when braking', b: { 'brk-pads-f': 2, 'brk-front': 1, 'brk-service': 1 } }, { l: 'All the time while driving', b: { 'brk-service': 2, caliper: 2, bearing: 2 } }, { l: 'Light braking at low speed', b: { 'brk-service': 3, 'brk-pads-f': 1 } }] },
  { id: 'eng-what', short: 'Engine', when: ['engine not working', "engine isn't working", 'engine problem', "won't run", 'stalls', 'stalling', 'stalled', 'engine dies', 'cuts out', 'runs rough', 'loses power'], ask: 'What is the engine doing?', opts: [{ l: 'Does not crank', b: { battery: 3, starter: 2, battcable: 2 } }, { l: 'Cranks but will not start', b: { fuelpump: 3, 'crk-sensor': 2, fuelfilt: 2, 'diag-engine': 2 } }, { l: 'Stalls or dies while driving', b: { maf: 2, 'crk-sensor': 2, fuelpump: 2, throttle: 2, alt: 1 } }, { l: 'Runs rough or loses power', b: { coil: 2, plugs: 2, maf: 2, injector: 1, vacleak: 2 } }] },
  { id: 'cel-drive', short: 'Driving', when: ['check engine', 'engine light'], ask: 'Has the car been driving any differently since the light came on?', opts: [{ l: 'Drives normally', b: { gascap: 3, evap: 2, o2: 1, 'diag-cel': 1 } }, { l: 'Rough or low power', b: { coil: 2, plugs: 2, maf: 2, injector: 1 } }, { l: 'Worse fuel economy', b: { o2: 3, maf: 1, cat: 1 } }] },
  { id: 'ac-air', short: 'Airflow', when: ['a/c', 'air conditioning', 'not cold', 'warm air', 'hot air', 'no cold air', 'vents'], ask: 'How is the airflow from the vents?', opts: [{ l: 'Weak airflow', b: { blower: 3, 'blower-res': 2, 'cabin-filt': 3 } }, { l: 'Strong but warm', b: { acrecharge: 2, 'ac-leak': 2, accomp: 1, 'ac-cond': 1 } }, { l: 'No air at all', b: { blower: 3, 'blower-res': 3 } }] },
  { id: 'ac-noise', short: 'A/C noise', when: ['a/c', 'air conditioning', 'not cold', 'warm air'], ask: 'Any noise from the compressor, or clicking when the A/C is switched on?', opts: [{ l: 'Loud noise', b: { accomp: 3, 'ac-clutch': 2 } }, { l: 'Clicks but does not engage', b: { 'ac-clutch': 3, 'ac-switch': 2 } }, { l: 'No noise', b: { 'ac-leak': 2, acrecharge: 1 } }] },
];
export const QWHY = { 'brk-when': 'The timing separates worn pads from dry hardware or a bearing.', 'eng-what': 'No crank, crank without start, stalling and rough running each point to different systems.', 'cel-drive': 'A light with no change in driving is often a cap or emissions item; rough running points to ignition or air.', 'ac-air': 'Weak airflow points to the blower or a clogged filter; warm but strong air points to the refrigerant side.', 'ac-noise': 'Compressor noise or a clutch that clicks without engaging separates a bad compressor or clutch from a low charge.', 'brk-where': 'Front and rear brakes are different repairs with different labor times.', 'brk-sound': 'The sound separates worn pads from rotors, calipers and other causes.', 'noise-when': 'When the noise happens points to suspension, bearings or brakes.', 'cel-flash': 'A flashing light means active misfires, which changes what to check first.', rough: 'Rough running separates ignition problems from emissions sensors.', coolant: 'A coolant leak points to hoses or the water pump, no leak points to the thermostat.', crank: 'What the engine does when you turn the key separates a battery from a starter.', acq: 'This separates a low charge from a failing compressor.', vib: 'Speed and braking narrow a shake down to tires, alignment or brakes.', leak: 'Where the leak is decides which gasket to check.', dur: 'How long it has been going on helps the advisor judge urgency.' };
export const QDUR = { id: 'dur', short: 'Duration', when: [], ask: 'How long has this been going on?', opts: [{ l: 'Just started', b: {} }, { l: 'A few days', b: {} }, { l: 'Weeks or more', b: {} }] };
export const QBY = Object.fromEntries(QB.concat([QDUR]).map(q => [q.id, q]));
export const ALLKW = (() => {
  const s = new Set();
  REP.forEach(r => r.strong.concat(r.kw).forEach(k => s.add(k)));
  QB.forEach(q => q.when.forEach(k => s.add(k)));
  return Array.from(s);
})();
export const BLOCK = { 'A/C service': ['acrecharge', 'accomp'], Alignment: ['align'], Tires: ['balance'] };

export const MAKES = { toyota: 'Toyota', honda: 'Honda', ford: 'Ford', chevrolet: 'Chevrolet', chevy: 'Chevrolet', nissan: 'Nissan', hyundai: 'Hyundai', kia: 'Kia', subaru: 'Subaru', mazda: 'Mazda', volkswagen: 'Volkswagen', vw: 'Volkswagen', bmw: 'BMW', mercedes: 'Mercedes-Benz', audi: 'Audi', jeep: 'Jeep', ram: 'Ram', gmc: 'GMC', dodge: 'Dodge', lexus: 'Lexus', acura: 'Acura' };
export const MODELS = { corolla: ['Corolla', 'Toyota'], camry: ['Camry', 'Toyota'], rav4: ['RAV4', 'Toyota'], tacoma: ['Tacoma', 'Toyota'], civic: ['Civic', 'Honda'], accord: ['Accord', 'Honda'], 'cr-v': ['CR-V', 'Honda'], crv: ['CR-V', 'Honda'], 'f-150': ['F-150', 'Ford'], f150: ['F-150', 'Ford'], escape: ['Escape', 'Ford'], explorer: ['Explorer', 'Ford'], silverado: ['Silverado', 'Chevrolet'], malibu: ['Malibu', 'Chevrolet'], equinox: ['Equinox', 'Chevrolet'], altima: ['Altima', 'Nissan'], sentra: ['Sentra', 'Nissan'], elantra: ['Elantra', 'Hyundai'], sonata: ['Sonata', 'Hyundai'], outback: ['Outback', 'Subaru'], forester: ['Forester', 'Subaru'], mazda3: ['Mazda3', 'Mazda'], 'cx-5': ['CX-5', 'Mazda'], golf: ['Golf', 'Volkswagen'], jetta: ['Jetta', 'Volkswagen'], wrangler: ['Wrangler', 'Jeep'] };
const rxEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const MAKE_RX = new RegExp('\\b(' + Object.keys(MAKES).map(rxEsc).join('|') + ')\\b', 'i');
export const MODEL_RX = new RegExp('\\b(' + Object.keys(MODELS).map(rxEsc).join('|') + ')\\b', 'i');
export const SAMPLE_MSG = '2018 Toyota Corolla 1.8L, 61k miles. Grinding noise when I brake and the steering wheel shakes on the highway.';
