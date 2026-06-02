export type Topic = {
  id: string;
  title: string;
  subtopics: string[];
  estimatedQCount: number;
  importance: 'high' | 'medium' | 'low';
  tags: ('formula-heavy' | 'numerical' | 'conceptual' | 'memory' | 'graph-reading')[];
};

// ─── Mechanical Engineering ───────────────────────────────────────────────────

export const mechanicalTopics: Topic[] = [
  { id: 'mech_thermo', title: 'Thermodynamics', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Laws of Thermodynamics', 'Carnot & Rankine Cycle', 'Refrigeration & AC (VCR, VCE)', 'IC Engines — Otto, Diesel, Dual', 'Gas Turbines & Brayton Cycle', 'Steam Tables'],
  },
  { id: 'mech_fluid', title: 'Fluid Mechanics & Machinery', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Fluid Properties & Statics', "Bernoulli's Equation", 'Flow Measurement (Venturimeter, Pitot)', 'Laminar & Turbulent Flow', 'Centrifugal Pumps & Turbines (Pelton, Francis, Kaplan)'],
  },
  { id: 'mech_som', title: 'Strength of Materials', estimatedQCount: 7, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Stress, Strain & Elastic Constants', 'Bending Moment & Shear Force Diagrams', 'Torsion of Shafts', 'Columns & Buckling', 'Pressure Vessels'],
  },
  { id: 'mech_heat', title: 'Heat Transfer', estimatedQCount: 6, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Conduction — Fourier Law', 'Convection — Newton Law', 'Radiation — Stefan-Boltzmann', 'Heat Exchangers (LMTD, NTU)', 'Extended Surfaces & Fins'],
  },
  { id: 'mech_tom', title: 'Theory of Machines', estimatedQCount: 6, importance: 'high', tags: ['conceptual', 'formula-heavy'],
    subtopics: ['Kinematics of Mechanisms', 'Gear Trains — Compound, Epicyclic', 'Flywheel & Governors', 'Balancing — Rotating & Reciprocating Masses', 'Vibrations — Free, Forced, Damped'],
  },
  { id: 'mech_mfg', title: 'Manufacturing & Production Engineering', estimatedQCount: 8, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['Casting & Metal Forming (Forging, Rolling)', 'Welding — Types, Defects', 'Metal Cutting — Tool Geometry, Cutting Forces', 'Lathe, Milling, Drilling', 'CNC & Metrology'],
  },
  { id: 'mech_ind', title: 'Industrial Engineering', estimatedQCount: 5, importance: 'medium', tags: ['numerical', 'conceptual'],
    subtopics: ['Work Study & Method Study', 'Inventory Control — EOQ, ABC', 'Production Planning & Control', 'PERT & CPM', 'Quality Control — Control Charts'],
  },
  { id: 'mech_mat', title: 'Material Science', estimatedQCount: 4, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Crystal Structures', 'Iron-Carbon Phase Diagram', 'Heat Treatment', 'Fatigue & Creep', 'Non-Ferrous Alloys'],
  },
  // New topics (NTPC/BHEL notifications)
  { id: 'mech_engg_mech', title: 'Engineering Mechanics', estimatedQCount: 5, importance: 'medium', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Free Body Diagrams', 'Equilibrium of Forces', 'Friction', 'Kinematics of Particles', "Dynamics — Newton's Laws", 'Virtual Work'],
  },
  { id: 'mech_machine_design', title: 'Machine Design', estimatedQCount: 5, importance: 'medium', tags: ['formula-heavy', 'conceptual'],
    subtopics: ['Design of Shafts & Keys', 'Bearings — Rolling & Sliding', 'Springs', 'Couplings', 'Fatigue Design', 'Factor of Safety'],
  },
  { id: 'mech_power_plant', title: 'Power Plant Engineering', estimatedQCount: 6, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['Rankine & Modified Rankine Cycle', 'Steam Power Plant Components', 'Gas Turbine Cycles', 'Hydroelectric Plant', 'Nuclear Power Basics', 'Cogeneration & Combined Cycle'],
  },
];

// ─── Electrical Engineering ───────────────────────────────────────────────────

export const electricalTopics: Topic[] = [
  { id: 'elec_circuits', title: 'Electric Circuits', estimatedQCount: 10, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['KVL, KCL, Mesh & Node Analysis', 'Thevenin, Norton, Superposition Theorems', 'AC Circuits — Phasors, Impedance, Power Factor', 'Resonance', 'Transient Analysis — RC, RL, RLC'],
  },
  { id: 'elec_machines', title: 'Electrical Machines', estimatedQCount: 12, importance: 'high', tags: ['conceptual', 'formula-heavy'],
    subtopics: ['DC Machines — Types, Characteristics, Speed Control', 'Transformers — OC/SC Tests, Efficiency', 'Induction Motors — Torque-Speed, Starting', 'Synchronous Machines', 'Special Machines — Stepper, BLDC'],
  },
  { id: 'elec_power', title: 'Power Systems', estimatedQCount: 10, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Transmission Line Parameters', 'Per Unit System', 'Load Flow Analysis', 'Fault Analysis (Symmetrical & Unsymmetrical)', 'Power System Protection — Relays, CB'],
  },
  { id: 'elec_control', title: 'Control Systems', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Transfer Functions & Block Diagrams', 'Time Domain Analysis', 'Bode Plot, Nyquist, Root Locus', 'PID Compensators', 'State Space Analysis'],
  },
  { id: 'elec_pe', title: 'Power Electronics', estimatedQCount: 8, importance: 'high', tags: ['conceptual', 'formula-heavy'],
    subtopics: ['Thyristors — SCR, TRIAC, DIAC', 'Rectifiers — Half/Full Wave, Controlled', 'Inverters — VSI, CSI', 'DC-DC Converters — Buck, Boost', 'AC & DC Drives'],
  },
  { id: 'elec_meas', title: 'Measurements & Instrumentation', estimatedQCount: 6, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Errors in Measurement', 'Bridges — Wheatstone, Maxwell', 'Transducers — LVDT, Strain Gauge, Thermocouple', 'CRO & Energy Meters'],
  },
  { id: 'elec_emf', title: 'Electromagnetic Fields', estimatedQCount: 6, importance: 'medium', tags: ['formula-heavy', 'conceptual'],
    subtopics: ["Maxwell's Equations", 'Gauss, Faraday, Ampere Laws', 'Wave Propagation & Poynting Vector', 'Inductance & Capacitance Calculation'],
  },
  // New topics (POWERGRID 2023 + NTPC 2024 notifications)
  { id: 'elec_digital', title: 'Digital Electronics & Microprocessors', estimatedQCount: 5, importance: 'medium', tags: ['conceptual', 'numerical'],
    subtopics: ['Number Systems & Boolean Algebra', 'Logic Gates & Combinational Circuits', 'Sequential Circuits — Flip Flops', '8085/8086 Architecture', 'Interrupts & I/O', 'Interfacing'],
  },
  { id: 'elec_hvdc', title: 'HVDC & FACTS Technology', estimatedQCount: 4, importance: 'medium', tags: ['conceptual', 'formula-heavy'],
    subtopics: ['HVDC Transmission — Monopolar/Bipolar', 'Converter Stations', 'FACTS Devices — SVC, STATCOM, TCSC', 'Power Quality & Harmonics', 'Reactive Power Compensation'],
  },
  { id: 'elec_renewable', title: 'Renewable Energy & Smart Grid', estimatedQCount: 4, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Solar PV — Grid-Tied Systems', 'Wind Energy — PMSG, DFIG', 'Energy Storage Systems', 'Smart Grid Architecture', 'Demand Response', 'Grid Integration Challenges'],
  },
];

// ─── Civil Engineering ────────────────────────────────────────────────────────

export const civilTopics: Topic[] = [
  { id: 'civil_struct', title: 'Structural Analysis', estimatedQCount: 10, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Static & Kinematic Indeterminacy', 'Method of Sections & Joints', 'Slope Deflection & Moment Distribution', 'Influence Lines', 'Matrix Methods'],
  },
  { id: 'civil_rcc', title: 'RCC & Steel Design', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Limit State Design (IS 456)', 'Flexure, Shear, Torsion in Beams', 'Design of Columns & Footings', 'Steel Design (IS 800)', 'Welded & Bolted Connections'],
  },
  { id: 'civil_geo', title: 'Geotechnical Engineering', estimatedQCount: 8, importance: 'high', tags: ['numerical', 'conceptual'],
    subtopics: ['Soil Classification & Phase Relations', 'Permeability & Seepage', 'Consolidation & Settlement', 'Shear Strength — Mohr-Coulomb', 'Bearing Capacity — Terzaghi'],
  },
  { id: 'civil_fluid', title: 'Fluid Mechanics & Hydraulics', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ["Bernoulli's Theorem", 'Flow Through Pipes', 'Open Channel Flow — Manning Equation', 'Hydraulic Turbines & Pumps', 'Notches & Weirs'],
  },
  { id: 'civil_survey', title: 'Surveying & Geomatics', estimatedQCount: 4, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Levelling & Contouring', 'Theodolite & Compass Survey', 'Errors & Adjustments', 'Remote Sensing & GIS Basics', 'Total Station & GPS'],
  },
  { id: 'civil_transport', title: 'Transportation Engineering', estimatedQCount: 5, importance: 'medium', tags: ['memory', 'conceptual'],
    subtopics: ['Highway Geometric Design', 'Pavement Design — Flexible & Rigid', 'Traffic Engineering', 'IRC Codes'],
  },
  { id: 'civil_env', title: 'Environmental Engineering', estimatedQCount: 5, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Water Treatment — Coagulation, Filtration, Chlorination', 'Sewage Treatment — BOD, COD, Activated Sludge', 'Air Pollution Control', 'Solid Waste Management'],
  },
  // New topics (BHEL, SAIL, CIL civil notifications)
  { id: 'civil_construction', title: 'Construction Technology & Project Management', estimatedQCount: 5, importance: 'medium', tags: ['memory', 'conceptual'],
    subtopics: ['Construction Materials — Cement, Steel, Concrete', 'IS Codes for Concrete Mix Design', 'Formwork & Scaffolding', 'Project Management — CPM, PERT, Gantt', 'Earthwork & Compaction', 'Quality Control in Construction'],
  },
  { id: 'civil_irrigation', title: 'Irrigation Engineering & Hydrology', estimatedQCount: 4, importance: 'medium', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Hydrological Cycle', 'Flood Estimation — Rational Method', 'Canal Design — Kennedy, Lacey', 'Irrigation Efficiency', 'Dams — Gravity, Earth', 'Watershed Management'],
  },
];

// ─── Chemical Engineering ─────────────────────────────────────────────────────

export const chemicalTopics: Topic[] = [
  { id: 'chem_fluid', title: 'Fluid Mechanics & Mechanical Operations', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ["Bernoulli's Equation", 'Pipe Flow & Losses', 'Pumps & Compressors', 'Flow Measurement', 'Fluidization', 'Size Reduction & Classification'],
  },
  { id: 'chem_heat', title: 'Heat Transfer', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Conduction, Convection, Radiation', 'Heat Exchangers — LMTD, NTU', 'Evaporators & Condensers'],
  },
  { id: 'chem_mass', title: 'Mass Transfer', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'conceptual'],
    subtopics: ['Diffusion — Fick Law', 'Distillation — McCabe-Thiele', 'Absorption & Stripping', 'Extraction & Leaching', 'Drying'],
  },
  { id: 'chem_rxn', title: 'Chemical Reaction Engineering', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Reaction Kinetics & Rate Laws', 'Ideal Reactors — CSTR, PFR, Batch', 'Non-Ideal Reactors & RTD', 'Heterogeneous Catalysis'],
  },
  { id: 'chem_thermo', title: 'Chemical Thermodynamics', estimatedQCount: 6, importance: 'high', tags: ['formula-heavy', 'conceptual'],
    subtopics: ['Phase Equilibria & VLE', 'Equations of State', 'Activity Coefficients', 'Reaction Equilibrium'],
  },
  { id: 'chem_process', title: 'Instrumentation & Process Control', estimatedQCount: 6, importance: 'high', tags: ['conceptual', 'formula-heavy'],
    subtopics: ['P&ID Symbols', 'PID Controllers', 'Control Loops', 'Process Dynamics', 'Stability Analysis'],
  },
  { id: 'chem_tech', title: 'Chemical Technology', estimatedQCount: 6, importance: 'medium', tags: ['memory', 'conceptual'],
    subtopics: ['Petroleum Refining Processes', 'Fertilizer & Ammonia Production', 'Polymer Manufacturing', 'Chlor-Alkali Industry'],
  },
  // New topics (IOCL, BPCL, GAIL notifications)
  { id: 'chem_safety', title: 'Process Safety & Environmental Engineering', estimatedQCount: 5, importance: 'high', tags: ['memory', 'conceptual'],
    subtopics: ['Hazard Identification — HAZOP, FMEA', 'Safety Instrumented Systems', 'Fire & Explosion Hazards', 'Effluent Treatment', 'Air Pollution Control', 'Waste Management Regulations'],
  },
  { id: 'chem_instr', title: 'Plant Instrumentation & Process Analytics', estimatedQCount: 4, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['P&ID Reading', 'Flow, Pressure, Temperature Instruments', 'Analyzer Systems — Chromatography', 'DCS & SCADA Basics', 'SIL Concepts'],
  },
];

// ─── Computer Science / IT ────────────────────────────────────────────────────

export const csTopics: Topic[] = [
  { id: 'cs_ds', title: 'Data Structures & Algorithms', estimatedQCount: 10, importance: 'high', tags: ['conceptual', 'numerical'],
    subtopics: ['Arrays, Linked Lists, Stacks, Queues', 'Trees — BST, AVL, Heap', 'Graphs — BFS, DFS, Shortest Path', 'Sorting & Searching', 'Time & Space Complexity'],
  },
  { id: 'cs_dbms', title: 'Database Management Systems', estimatedQCount: 8, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['ER Model & Relational Algebra', 'SQL — DDL, DML, DCL', 'Normalization — 1NF to BCNF', 'Transaction Management & ACID', 'Indexing & B+ Trees'],
  },
  { id: 'cs_os', title: 'Operating Systems', estimatedQCount: 8, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['Process Scheduling', 'Memory Management — Paging, Segmentation', 'Deadlock Detection & Prevention', 'File Systems'],
  },
  { id: 'cs_networks', title: 'Computer Networks', estimatedQCount: 8, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['OSI & TCP/IP Models', 'IP Addressing & Subnetting', 'Routing Protocols — OSPF, RIP, BGP', 'TCP vs UDP', 'HTTP, DNS, DHCP'],
  },
  { id: 'cs_prog', title: 'Programming & OOP', estimatedQCount: 8, importance: 'medium', tags: ['conceptual', 'numerical'],
    subtopics: ['C/C++ Fundamentals', 'OOP — Inheritance, Polymorphism', 'Pointers & Memory Management', 'Java Basics'],
  },
  { id: 'cs_co', title: 'Computer Organization & Architecture', estimatedQCount: 6, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Number Systems & Boolean Algebra', 'Logic Gates & Circuits', 'CPU Architecture & Pipelining', 'Memory Hierarchy'],
  },
  // New topics (BHEL CS, CIL IT, NTPC CS notifications)
  { id: 'cs_se', title: 'Software Engineering & System Design', estimatedQCount: 4, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['SDLC Models — Waterfall, Agile', 'Software Testing — Unit, Integration, System', 'Design Patterns', 'UML Diagrams', 'REST APIs', 'Microservices Basics'],
  },
  { id: 'cs_theory', title: 'Theory of Computation & Compiler Design', estimatedQCount: 4, importance: 'medium', tags: ['conceptual', 'numerical'],
    subtopics: ['Finite Automata & Regular Languages', 'Context-Free Grammars', 'Turing Machines', 'Lexical Analysis', 'Parsing — LL, LR', 'Code Optimization'],
  },
];

// ─── Electronics & Instrumentation ───────────────────────────────────────────

export const electronicsTopics: Topic[] = [
  { id: 'ec_analog', title: 'Analog Electronics', estimatedQCount: 10, importance: 'high', tags: ['formula-heavy', 'conceptual'],
    subtopics: ['Diodes — Rectifiers, Zener', 'BJT & MOSFET Amplifiers', 'Op-Amp Configurations', 'Oscillators — LC, RC', 'Power Amplifiers'],
  },
  { id: 'ec_digital', title: 'Digital Electronics', estimatedQCount: 8, importance: 'high', tags: ['conceptual', 'numerical'],
    subtopics: ['Boolean Algebra & K-Map', 'Combinational Circuits — MUX, Decoder', 'Sequential Circuits — Flip Flops, Counters', 'ADC & DAC Converters'],
  },
  { id: 'ec_control', title: 'Control Systems', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Transfer Functions', 'Time & Frequency Response', 'Root Locus, Bode Plot, Nyquist', 'PID Controllers'],
  },
  { id: 'ec_comm', title: 'Communication Systems', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'conceptual'],
    subtopics: ['AM, FM, PM Modulation', 'Sampling Theorem & PCM', 'Digital Modulation — ASK, FSK, PSK, QAM', 'Multiplexing — TDM, FDM'],
  },
  { id: 'ec_signal', title: 'Networks, Signals & Systems', estimatedQCount: 6, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Fourier Series & Transform', 'Laplace & Z-Transform', 'Convolution & Correlation', 'LTI Systems', 'Network Theorems'],
  },
  { id: 'ec_instr', title: 'Instrumentation', estimatedQCount: 6, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Sensors — LVDT, RTD, Thermocouple', 'Signal Conditioning', 'Data Acquisition Systems', 'Industrial Instrumentation'],
  },
  // New topics (BHEL EC, NTPC EC notifications)
  { id: 'ec_micro', title: 'Microprocessors & Embedded Systems', estimatedQCount: 6, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['8051 & ARM Architecture', 'Memory Interfacing', 'Timers & Interrupts', 'Serial Communication — UART, SPI, I2C', 'Real-Time OS Basics', 'Embedded C Programming'],
  },
  { id: 'ec_vlsi', title: 'VLSI Design', estimatedQCount: 4, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['CMOS Technology', 'Digital IC Design Flow', 'Logic Synthesis', 'Timing Analysis', 'FPGA Architecture', 'HDL — Verilog Basics'],
  },
];

// ─── Metallurgy Engineering ───────────────────────────────────────────────────

export const metallurgyTopics: Topic[] = [
  { id: 'met_phase', title: 'Physical Metallurgy', estimatedQCount: 10, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['Crystal Structures — BCC, FCC, HCP', 'Iron-Carbon Phase Diagram', 'Heat Treatment', 'TTT & CCT Diagrams', 'Grain Growth'],
  },
  { id: 'met_mech', title: 'Mechanical Metallurgy', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Deformation — Slip & Twinning', 'Creep & Fatigue', 'Fracture Mechanics', 'Hardness Testing'],
  },
  { id: 'met_extract', title: 'Extractive Metallurgy', estimatedQCount: 8, importance: 'high', tags: ['memory', 'conceptual'],
    subtopics: ['Iron & Steel Making — Blast Furnace, BOF, EAF', 'Non-Ferrous Extraction — Al, Cu, Zn', 'Hydrometallurgy & Electrometallurgy', 'Mineral Processing — Flotation, Gravity'],
  },
  { id: 'met_mfg', title: 'Manufacturing Processes', estimatedQCount: 6, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Casting — Sand, Investment', 'Metal Working — Rolling, Forging', 'Welding Metallurgy', 'Powder Metallurgy'],
  },
  // New topics (SAIL, NALCO, BHEL Met notifications)
  { id: 'met_ndt', title: 'Non-Destructive Testing & Quality Control', estimatedQCount: 5, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['Visual & Dye Penetrant Testing', 'Magnetic Particle Testing', 'Ultrasonic Testing — A/B/C Scan', 'Radiography', 'Eddy Current Testing', 'Statistical Quality Control'],
  },
  { id: 'met_corrosion', title: 'Corrosion Engineering', estimatedQCount: 4, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Electrochemical Theory of Corrosion', 'Types — Galvanic, Pitting, Crevice', 'Corrosion Protection — Coatings, Cathodic', 'Oxidation at High Temperatures', 'Failure Analysis'],
  },
];

// ─── Mining Engineering ───────────────────────────────────────────────────────

export const miningTopics: Topic[] = [
  { id: 'mine_methods', title: 'Mining Methods & Machinery', estimatedQCount: 12, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['Surface Mining — Open Cast, Strip', 'Underground Mining — Room & Pillar, Long Wall', 'Shaft Sinking & Drifting', 'Stoping Methods', 'Loaders, Dumpers & Continuous Miners'],
  },
  { id: 'mine_geotech', title: 'Geomechanics & Ground Control', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'conceptual'],
    subtopics: ['Rock Properties & Classification', 'Rock Mass Classification — RQD, RMR, Q', 'Slope Stability', 'Support Design — Pillars, Roof Bolts', 'Subsidence & Ground Vibrations'],
  },
  { id: 'mine_ventilation', title: 'Mine Ventilation', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'conceptual'],
    subtopics: ['Natural & Mechanical Ventilation', 'Mine Gases — Methane, CO, CO₂', 'Dust Control', 'Ventilation Network Analysis', 'Auxiliary Ventilation'],
  },
  { id: 'mine_explosive', title: 'Drilling & Blasting', estimatedQCount: 6, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Types of Explosives', 'Blast Design — Burden, Spacing', 'Initiating Devices', 'Controlled Blasting', 'ANFO & Slurry Explosives'],
  },
  { id: 'mine_equip', title: 'Mine Planning & Economics', estimatedQCount: 6, importance: 'medium', tags: ['memory', 'conceptual'],
    subtopics: ['Reserve Estimation Methods', 'Mine Scheduling & Sequencing', 'Capital & Operating Cost', 'Productivity Analysis', 'Systems Engineering — CPM, PERT'],
  },
  // New topics (CIL notification — safety-law heavy)
  { id: 'mine_safety', title: 'Mine Safety, Legislation & Environment', estimatedQCount: 10, importance: 'high', tags: ['memory', 'conceptual'],
    subtopics: ['Mines Act 1952', 'Coal Mines Regulations 2017', 'Metalliferous Mines Regulations', 'Statutory Roles — Manager, Overman', 'First Aid & Mine Rescue', 'Environmental Impact Assessment', 'Mine Closure'],
  },
  { id: 'mine_survey', title: 'Mine Surveying & Planning', estimatedQCount: 5, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Mine Survey Instruments', 'Surface & Underground Surveying', 'Mine Plan & Section', 'Reserve Estimation', 'GIS in Mining', 'Surpac & MineSight Basics'],
  },
];

// ─── Petroleum Engineering ────────────────────────────────────────────────────

export const petroleumTopics: Topic[] = [
  { id: 'petro_reservoir', title: 'Reservoir Engineering', estimatedQCount: 12, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Porosity & Permeability', "Darcy's Law", 'Material Balance Equations', 'Pressure Transient Analysis', 'Recovery Factor & Drive Mechanisms'],
  },
  { id: 'petro_drill', title: 'Drilling Engineering', estimatedQCount: 10, importance: 'high', tags: ['conceptual', 'formula-heavy'],
    subtopics: ['Rotary Drilling System', 'Drilling Fluids & Mud Engineering', 'Casing Design & Cementing', 'Well Control — BOP', 'Directional Drilling'],
  },
  { id: 'petro_prod', title: 'Production Engineering', estimatedQCount: 8, importance: 'high', tags: ['conceptual', 'formula-heavy'],
    subtopics: ['Well Completion & Perforation', 'Artificial Lift — ESP, Gas Lift', 'Flow Assurance', 'Well Stimulation — Acidizing, Fracturing'],
  },
  { id: 'petro_refine', title: 'Petroleum Refining', estimatedQCount: 8, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Crude Distillation — ADU, VDU', 'Cracking — FCC, Hydrocracking', 'Reforming & Isomerization', 'Desulfurization'],
  },
  // New topics (ONGC/GAIL/IOCL notifications)
  { id: 'petro_surface', title: 'Surface Facilities & Gas Processing', estimatedQCount: 6, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Oil-Water-Gas Separation', 'Gas Sweetening — Amine Process', 'Dehydration — TEG', 'LNG Liquefaction', 'Pipeline Hydraulics', 'Metering & Custody Transfer'],
  },
  { id: 'petro_hse', title: 'HSE in Oil & Gas', estimatedQCount: 4, importance: 'medium', tags: ['memory', 'conceptual'],
    subtopics: ['OISD Standards', 'Petroleum Act & Rules', 'Environmental Regulations — EPA, CPCB norms', 'Emergency Response Planning', 'Risk Assessment — HAZOP, What-If'],
  },
];

// ─── Geophysics ───────────────────────────────────────────────────────────────

export const geophysicsTopics: Topic[] = [
  { id: 'geo_seismic', title: 'Seismic Methods', estimatedQCount: 12, importance: 'high', tags: ['conceptual', 'formula-heavy'],
    subtopics: ['Seismic Wave Theory', 'Refraction & Reflection Methods', 'Data Acquisition', 'Seismic Processing — NMO, Migration', 'Interpretation'],
  },
  { id: 'geo_gravity', title: 'Gravity & Magnetic Methods', estimatedQCount: 8, importance: 'high', tags: ['formula-heavy', 'conceptual'],
    subtopics: ['Gravity Survey Corrections', 'Gravity Anomaly Interpretation', 'Magnetic Properties of Rocks', 'Aeromagnetic Surveys'],
  },
  { id: 'geo_electrical', title: 'Electrical & EM Methods', estimatedQCount: 8, importance: 'high', tags: ['conceptual', 'formula-heavy'],
    subtopics: ['Resistivity Surveys', 'IP & SP Methods', 'EM Methods — TDEM, FDEM', 'Ground Penetrating Radar'],
  },
  { id: 'geo_well', title: 'Well Logging', estimatedQCount: 8, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['Gamma Ray & SP Logs', 'Resistivity Logs', 'Density & Neutron Logs', 'Sonic Log', 'Log Interpretation'],
  },
];

// ─── HR / Finance / Management ────────────────────────────────────────────────

export const hrFinanceTopics: Topic[] = [
  { id: 'hr_mgmt', title: 'Human Resource Management', estimatedQCount: 10, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['Recruitment & Selection', 'Training & Development', 'Performance Appraisal', 'Labour Laws — EPF, ESI, Factories Act', 'Industrial Relations'],
  },
  { id: 'hr_finance', title: 'Financial Management', estimatedQCount: 10, importance: 'high', tags: ['formula-heavy', 'numerical'],
    subtopics: ['Financial Statement Analysis', 'Ratio Analysis', 'Capital Budgeting — NPV, IRR', 'Working Capital Management', 'Cost Accounting'],
  },
  { id: 'hr_obm', title: 'Organisational Behaviour', estimatedQCount: 8, importance: 'high', tags: ['conceptual', 'memory'],
    subtopics: ['Motivation Theories — Maslow, Herzberg', 'Leadership Styles', 'Organizational Culture', 'Communication in Organizations', 'Group Dynamics & Conflict'],
  },
  { id: 'hr_mktg', title: 'Marketing Management', estimatedQCount: 6, importance: 'medium', tags: ['conceptual', 'memory'],
    subtopics: ['Marketing Mix — 4Ps', 'Consumer Behavior', 'Market Segmentation & Positioning', 'Digital Marketing'],
  },
  { id: 'hr_ca', title: 'Accounting & Taxation', estimatedQCount: 6, importance: 'medium', tags: ['numerical', 'memory'],
    subtopics: ['Double Entry System', 'Balance Sheet & P&L', 'GST Basics', 'Income Tax Heads', 'Company Law Basics'],
  },
  // New topic (PSU HR exams consistently test this)
  { id: 'hr_or', title: 'Operations Research & Business Statistics', estimatedQCount: 5, importance: 'medium', tags: ['numerical', 'formula-heavy'],
    subtopics: ['Linear Programming — Simplex', 'Transportation & Assignment Problems', 'Queuing Theory', 'Probability Distributions', 'Hypothesis Testing', 'Regression Analysis'],
  },
];

// ─── Domain topic map ─────────────────────────────────────────────────────────

export const domainTopicMap: Record<string, Topic[]> = {
  mechanical:  mechanicalTopics,
  electrical:  electricalTopics,
  civil:       civilTopics,
  chemical:    chemicalTopics,
  cs:          csTopics,
  electronics: electronicsTopics,
  metallurgy:  metallurgyTopics,
  mining:      miningTopics,
  petroleum:   petroleumTopics,
  geophysics:  geophysicsTopics,
  hr_finance:  hrFinanceTopics,
};
