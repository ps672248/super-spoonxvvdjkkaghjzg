import json

# Define the 10 categories with 50 specific themes each
categories_data = [
    {
        "category": "hooks_and_procrastination",
        "character": "arjun",
        "fallback": "scenes/scene1_arjun_desk.jpg",
        "mouth": "ARJUN_DEFAULT_MOUTH",
        "setting": "study_desk",
        "themes": [
            ("arjun_head_in_hands_books", "Arjun sitting with head in hands overwhelmed by towering book piles at study desk", "overwhelmed", "medium_shot"),
            ("arjun_blank_stare_formula_sheet", "Arjun staring blankly at a complex formula sheet with complete brain freeze", "confused", "close_up"),
            ("arjun_bed_phone_doomscrolling", "Arjun lying in dark room with phone glowing on face doomscrolling reels at 2 AM", "guilty", "close_up"),
            ("arjun_panic_exam_calendar", "Arjun pointing with shaking hands at a wall calendar where exam date is circled in bold red", "panicked", "medium_shot"),
            ("arjun_rubbing_eyes_coffee_burnout", "Arjun rubbing weary eyes with three empty coffee mugs beside him after all-nighter", "exhausted", "close_up"),
            ("arjun_crumpling_mock_test_score", "Arjun crushing printed mock test result paper in frustration after seeing negative marking", "frustrated", "medium_shot"),
            ("arjun_chewing_pencil_stuck", "Arjun chewing pencil eraser stuck on question 3 for 45 minutes with blank rough sheet", "stuck", "close_up"),
            ("arjun_slumped_on_keyboard", "Arjun slumped face-down across his laptop keyboard defeated by 200-page thermodynamics PDF", "defeated", "medium_shot"),
            ("arjun_phone_notification_temptation", "Arjun trying to read notes but eyes magnetically pulled toward buzzing phone notification", "distracted", "medium_shot"),
            ("arjun_guilty_clock_stare_2am", "Arjun staring at wall clock ticking past 2:30 AM with intense guilt over wasted study hours", "guilty", "close_up"),
            ("arjun_confused_scratching_head", "Arjun scratching messy hair totally baffled by an abstract differential calculus equation", "confused", "medium_shot"),
            ("arjun_pacing_room_anxiety", "Arjun nervously pacing back and forth across his room holding syllabus sheet with jittery hands", "anxious", "wide"),
            ("arjun_staring_at_cutoff_sheet", "Arjun wide-eyed in disbelief looking at PSU opening closing ranks sheet showing steep cutoff", "shocked", "close_up"),
            ("arjun_hiding_face_behind_book", "Arjun peeking over the top edge of a giant standard reference textbook with anxious wide eyes", "timid", "close_up"),
            ("arjun_throwing_hands_in_air", "Arjun throwing both hands in the air in surrender exclaiming that syllabus will never end", "exasperated", "medium_shot"),
            ("arjun_glaring_at_phone_regret", "Arjun glaring furiously at phone screen showing 5 hours spent on Instagram reels today", "regretful", "close_up"),
            ("arjun_talking_to_desk_plant", "Arjun deliriously explaining the Carnot cycle to a plastic desk succulent in late night madness", "delirious", "medium_shot"),
            ("arjun_sighing_deeply_window", "Arjun resting chin on hand looking out window deeply sighing daydreaming about life post-exam", "melancholic", "medium_shot"),
            ("arjun_comparing_with_topper_notes", "Arjun comparing his chaotic chicken-scratch notes against a color-coded topper notebook", "insecure", "medium_shot"),
            ("arjun_nervous_pen_tapping", "Extreme close up of Arjun nervously and rhythmically tapping pen on blank mock question sheet", "anxious", "close_up"),
            ("arjun_blank_screen_laptop_freeze", "Arjun frozen in front of a test portal timer ticking down with zero answers submitted", "frozen", "medium_shot"),
            ("arjun_stomach_knot_exam_morning", "Arjun clutching stomach with that familiar pre-exam knot and test morning jitters", "anxious", "medium_shot"),
            ("arjun_holding_pile_of_photocopies", "Arjun struggling under physical weight of a giant 2-foot tower of coaching center photocopies", "burdened", "medium_shot"),
            ("arjun_shrugging_helplessly", "Arjun shrugging with open palms looking at camera saying kuch samajh nahi aa raha kahan se shuru karun", "helpless", "medium_shot"),
            ("arjun_banging_forehead_softly", "Arjun gently and humorously tapping forehead against wooden desk after silly formula mistake", "self_deprecating", "medium_shot"),
            ("arjun_wide_eyed_syllabus_shock", "Arjun scrolling official GATE syllabus PDF with eyes growing wider and wider at endless topic list", "shocked", "close_up"),
            ("arjun_battery_one_percent_panic", "Arjun panicking as laptop battery flashes 1 percent during live mock test without charger", "panicked", "close_up"),
            ("arjun_spilling_chai_on_notes", "Arjun gasping in horror as three drops of hot cutting chai spill across his handwritten formula sheet", "horrified", "medium_shot"),
            ("arjun_lying_to_parents_phone", "Arjun nervously holding phone to ear telling parents haan mummy syllabus bas khatam hone wala hai", "nervous_guilt", "medium_shot"),
            ("arjun_staring_at_ceiling_fan", "Arjun lying flat on bed staring at revolving ceiling fan wondering if engineering was right choice", "existential", "wide"),
            ("arjun_highlighting_entire_page", "Arjun realizing he accidentally highlighted the entire page in neon yellow with zero actual recall", "foolish", "close_up"),
            ("arjun_opening_ten_browser_tabs", "Arjun looking at 32 open browser tabs on GATE preparation feeling analysis paralysis", "overwhelmed", "medium_shot"),
            ("arjun_setting_five_alarms", "Arjun setting 5 alarms from 5:00 AM to 5:45 AM knowing deep inside he will snooze all of them", "delusional", "close_up"),
            ("arjun_snoozing_alarm_guilt", "Arjun slapping alarm clock off at 6 AM pulling blanket over head with intense morning guilt", "guilty", "medium_shot"),
            ("arjun_looking_at_coaching_fee_bill", "Arjun looking somberly at huge coaching institute receipt feeling immense pressure to deliver", "pressured", "close_up"),
            ("arjun_pretending_to_study_guest", "Arjun frantically posing with book in hand as relative knocks on study room door", "pretending", "medium_shot"),
            ("arjun_reading_same_line_five_times", "Arjun rubbing temples realizing he just read the exact same textbook sentence 5 times in a row", "brain_dead", "close_up"),
            ("arjun_looking_at_successful_friend_linkedin", "Arjun scrolling LinkedIn seeing college batchmate post 20 LPA job offer while he is still revising", "envious", "close_up"),
            ("arjun_holding_empty_pen_refill", "Arjun looking at empty Reynolds pen refill feeling he solved 100 pages of questions but retained zero", "empty", "close_up"),
            ("arjun_sitting_in_dark_load_shedding", "Arjun sitting in dark hostel room during power cut studying under faint smartphone flashlight", "struggling", "medium_shot"),
            ("arjun_doodling_in_margins", "Arjun caught doodling cartoon robots in the margins of his control systems textbook", "distracted", "close_up"),
            ("arjun_counting_remaining_hours", "Arjun frantically tapping calculator calculating exact hours left until exam hall entry", "frenetic", "medium_shot"),
            ("arjun_looking_at_thick_standard_book", "Arjun holding 1200-page foreign author book wondering who actually finishes this monster", "intimidated", "medium_shot"),
            ("arjun_begging_notes_on_whatsapp", "Arjun typing frantic WhatsApp audio message to college topper bhai please short notes bhej de", "pleading", "close_up"),
            ("arjun_staring_at_timer_zero", "Arjun watching mock test timer hit 00:00:00 with 15 questions left unattempted", "crushed", "close_up"),
            ("arjun_holding_cold_samosa", "Arjun eating cold stale canteen samosa at desk while memorizing Fourier transform properties", "depressing", "medium_shot"),
            ("arjun_confusing_units_in_numerical", "Arjun realizing he mixed up millimeters and meters after spending 20 minutes on a calculation", "facepalm", "close_up"),
            ("arjun_collapsing_on_books_nap", "Arjun taking a 10-minute power nap on his open book that accidentally turns into 3 hours", "asleep", "medium_shot"),
            ("arjun_looking_at_unopened_parcel", "Arjun looking at unboxing box of 14 new test series books that he hasn't even cut the tape of", "intimidated", "medium_shot"),
            ("arjun_clutching_head_formula_overload", "Arjun holding both sides of head feeling like his brain hard drive is at 99 percent storage full", "saturated", "close_up"),
        ]
    },
    {
        "category": "formula_and_concept_struggles",
        "character": "arjun",
        "fallback": "scenes/scene1_arjun_desk.jpg",
        "mouth": "ARJUN_DEFAULT_MOUTH",
        "setting": "study_desk",
        "themes": [
            ("arjun_mixing_sine_cosine_signs", "Arjun agonizing over whether the Fourier sine transform has a negative sign in the exponent", "confused", "close_up"),
            ("arjun_thermodynamics_entropy_puzzle", "Arjun drawing crazy thermodynamic cycle loops on paper trying to figure out entropy change", "perplexed", "medium_shot"),
            ("arjun_maxwell_equations_stare", "Arjun staring at Maxwell's curl equations like they are written in alien hieroglyphics", "baffled", "close_up"),
            ("arjun_laplace_transform_table_nightmare", "Arjun flipping rapidly through 4 pages of Laplace transforms trying to find inverse transform", "frantic", "medium_shot"),
            ("arjun_matrix_eigenvalue_zero_error", "Arjun realizing determinant is zero after solving 3x3 characteristic polynomial for 15 minutes", "exasperated", "medium_shot"),
            ("arjun_bending_moment_diagram_upside_down", "Arjun looking at his cantilever beam diagram realizing he drew the bending moment upside down", "annoyed", "medium_shot"),
            ("arjun_fluid_mechanics_navier_stokes_fear", "Arjun trembling looking at Navier-Stokes differential equation wondering why water is so complicated", "intimidated", "close_up"),
            ("arjun_circuit_kcl_kvl_sign_trap", "Arjun recalculating loop current for the 4th time getting a negative voltage every single time", "frustrated", "medium_shot"),
            ("arjun_control_systems_bode_plot_mess", "Arjun drawing wobbly semi-log Bode plot phase margin line that crosses the wrong axis", "struggling", "medium_shot"),
            ("arjun_probability_bayes_theorem_trap", "Arjun getting probability greater than 1.0 on a conditional probability Bayes numerical", "horrified", "close_up"),
            ("arjun_data_structures_recursion_stack_overflow", "Arjun tracing recursive Fibonacci tree on paper running out of page margin completely", "overwhelmed", "medium_shot"),
            ("arjun_digital_logic_kmap_grouping_fail", "Arjun staring at Karnaugh map having missed an obvious quad corner grouping", "facepalm", "close_up"),
            ("arjun_strength_of_materials_mohrs_circle_tangle", "Arjun with compass in hand drawing messy Mohr's circle with wrong shear stress center", "clumsy", "medium_shot"),
            ("arjun_heat_transfer_radiation_view_factor", "Arjun scratching chin trying to calculate radiation shape factor between two coaxial cylinders", "puzzled", "medium_shot"),
            ("arjun_algorithms_dijkstra_negative_edge_trap", "Arjun realizing he applied Dijkstra on a graph with negative edge weights", "self_deprecating", "close_up"),
            ("arjun_compiler_design_ll1_grammar_conflict", "Arjun discovering first and follow set conflicts in his LL1 parsing table", "annoyed", "medium_shot"),
            ("arjun_signal_processing_nyquist_rate_half", "Arjun realizing he divided by 2 instead of multiplying by 2 for Nyquist sampling frequency", "crushed", "close_up"),
            ("arjun_structural_analysis_truss_zero_force", "Arjun manually calculating 12 truss members only to realize 8 of them were zero force members", "foolish", "medium_shot"),
            ("arjun_soil_mechanics_shear_strength_phi", "Arjun confusing drained and undrained triaxial test parameters in geotechnical question", "confused", "close_up"),
            ("arjun_machine_design_bearing_life_cube", "Arjun forgetting if dynamic load rating uses power 3 for ball or 10/3 for roller bearings", "hesitant", "close_up"),
            ("arjun_manufacturing_taylor_tool_life_error", "Arjun recalculating cutting speed exponent in Taylor tool life equation VT^n = C", "struggling", "medium_shot"),
            ("arjun_database_normalization_bcnf_lossless", "Arjun checking functional dependencies trying to decompose table into 3NF vs BCNF", "perplexed", "medium_shot"),
            ("arjun_computer_networks_subnet_mask_binary", "Arjun converting CIDR /27 to decimal mask scribbling powers of 2 across paper", "concentrated", "close_up"),
            ("arjun_operating_systems_bankers_algorithm_loop", "Arjun tracing safety state matrix in Banker's algorithm stuck in deadlock cycle", "stuck", "medium_shot"),
            ("arjun_electromagnetics_poynting_vector_direction", "Arjun contorting right hand in weird angles trying to apply right-hand thumb rule", "hilarious", "medium_shot"),
            ("arjun_power_systems_load_flow_jacobian", "Arjun looking at 4x4 Newton-Raphson Jacobian matrix with sheer disbelief", "terror", "close_up"),
            ("arjun_surveying_two_peg_test_collimation", "Arjun looking at dumpy level leveling staff readings confused by collimation error", "puzzled", "medium_shot"),
            ("arjun_highway_engineering_superelevation_calc", "Arjun recalculating centrifugal ratio e + f = V^2 / 225R getting negative friction", "baffled", "close_up"),
            ("arjun_analog_circuits_opamp_virtual_ground", "Arjun applying virtual ground on an op-amp with positive feedback by mistake", "annoyed", "medium_shot"),
            ("arjun_communication_systems_fm_bandwidth_carson", "Arjun confusing Carson's rule with narrow-band FM bandwidth formula", "hesitant", "close_up"),
            ("arjun_theory_of_machines_inversion_four_bar", "Arjun moving fingers like crank-rocker mechanism trying to visualize Grashof's law", "visualizing", "medium_shot"),
            ("arjun_refrigeration_cop_carnot_inverted", "Arjun getting refrigerator COP of 0.2 because he flipped heat absorbed and work input", "facepalm", "close_up"),
            ("arjun_ic_engines_otto_diesel_efficiency_cutoff", "Arjun drawing P-V diagrams comparing Otto and Diesel cycle for same peak pressure", "concentrated", "medium_shot"),
            ("arjun_power_plant_reheat_rankine_steam_tables", "Arjun flipping desperately through Mollier steam chart looking for enthalpy at 50 bar", "frantic", "medium_shot"),
            ("arjun_casting_chvorinov_rule_modulus", "Arjun checking solidification time ratio using Chvorinov rule for cylinder vs sphere", "calculating", "close_up"),
            ("arjun_welding_heat_input_efficiency_formula", "Arjun calculating heat input H = V*I*efficiency / speed missing the voltage term", "confused", "close_up"),
            ("arjun_queueing_theory_mm1_waiting_time", "Arjun confusing average time in system W with average waiting time in queue Wq", "annoyed", "close_up"),
            ("arjun_linear_programming_simplex_pivot_element", "Arjun entering negative pivot column in simplex tableau getting an unbounded solution", "frustrated", "medium_shot"),
            ("arjun_transportation_traffic_poisson_arrival", "Arjun calculating probability of 0 vehicle arrivals in 10-second gap on green light", "stuck", "close_up"),
            ("arjun_environmental_bod_ultimate_rate_constant", "Arjun recalculating 5-day BOD at 20 degrees Celsius using base 10 instead of base e", "baffled", "close_up"),
            ("arjun_steel_structures_plastic_moment_shape_factor", "Arjun calculating plastic section modulus Zp for I-beam missing flange contribution", "struggling", "medium_shot"),
            ("arjun_concrete_rcc_singly_vs_doubly_reinforced", "Arjun checking neutral axis depth xu against xu_max realizing beam is over-reinforced", "worried", "close_up"),
            ("arjun_hydrology_unit_hydrograph_convolution", "Arjun convoluting rainfall excess hyetograph getting runoff volume twice the basin area", "perplexed", "medium_shot"),
            ("arjun_irrigation_duty_delta_base_period_864", "Arjun forgetting if duty delta formula uses 8.64 B / D or 864 B / D with hectares", "hesitant", "close_up"),
            ("arjun_antenna_radiation_pattern_half_wave_dipole", "Arjun sketching toroidal 3D radiation pattern of dipole antenna in air with pencil", "visualizing", "medium_shot"),
            ("arjun_microprocessor_8085_flag_register_parity", "Arjun manually counting number of 1s in accumulator to determine parity flag status", "tedious", "close_up"),
            ("arjun_vlsi_cmos_inverter_delay_capacitance", "Arjun calculating propagation delay of CMOS logic gate balancing PMOS vs NMOS widths", "intense", "medium_shot"),
            ("arjun_network_security_rsa_modular_inverse", "Arjun doing extended Euclidean algorithm to find private key d modulo phi of n", "headache", "close_up"),
            ("arjun_finite_automata_nfa_to_dfa_subset_explosion", "Arjun drawing 16 DFA states from a 4-state NFA running completely out of paper", "exhausted", "medium_shot"),
            ("arjun_compiler_lr0_parsing_shift_reduce_conflict", "Arjun staring at state 5 in LR(0) automaton having a fatal shift-reduce conflict", "hopeless", "close_up"),
        ]
    },
    {
        "category": "mock_test_and_percentile_pain",
        "character": "arjun",
        "fallback": "scenes/scene1_arjun_desk.jpg",
        "mouth": "ARJUN_DEFAULT_MOUTH",
        "setting": "study_desk",
        "themes": [
            ("arjun_mock_test_negative_mark_fury", "Arjun staring at -0.66 negative marking deducting his hard-earned marks in mock test", "furious", "close_up"),
            ("arjun_mock_percentile_drop_shock", "Arjun jaw dropped seeing his All India Mock Rank slide from Top 100 to Rank 4200", "shocked", "close_up"),
            ("arjun_running_out_of_virtual_calc_time", "Arjun furiously tapping the laggy onscreen GATE virtual calculator with mouse cursor", "panicked", "close_up"),
            ("arjun_skipping_five_questions_in_a_row", "Arjun clicking Next Question five times consecutively seeing only red unattempted marks", "crushed", "medium_shot"),
            ("arjun_virtual_calculator_bracket_syntax_error", "Arjun getting syntax error on onscreen virtual calculator because of extra closing parenthesis", "annoyed", "close_up"),
            ("arjun_marked_for_review_forgot_to_save", "Arjun realizing 4 questions marked for review were never saved before time expired", "horrified", "close_up"),
            ("arjun_reading_question_wrong_not_correct", "Arjun realizing the question asked which of the following is NOT correct", "facepalm", "close_up"),
            ("arjun_rounding_off_decimal_places_error", "Arjun entering 3.14 instead of rounding off to 2 decimal places as 3.142 losing marks", "annoyed", "close_up"),
            ("arjun_analyzing_silly_mistake_notebook", "Arjun writing in his dedicated Silly Mistakes diary shaking head in disbelief", "humiliated", "medium_shot"),
            ("arjun_mock_scorecard_red_marks_streak", "Arjun looking at subject-wise analysis chart where mathematics is bleeding red", "worried", "medium_shot"),
            ("arjun_comparing_accuracy_with_batchmate", "Arjun looking at friend's 88 percent accuracy while his own is languishing at 52 percent", "insecure", "medium_shot"),
            ("arjun_time_spent_per_question_ten_minutes", "Arjun test analytics showing he spent 14 minutes on a single 1-mark numerical question", "ashamed", "close_up"),
            ("arjun_staring_at_rank_one_score_92", "Arjun looking at mock test topper who scored 94 out of 100 wondering if they are human", "awestruck", "close_up"),
            ("arjun_sectional_cutoff_missed_by_one_mark", "Arjun realizing he cleared overall cutoff but missed general aptitude sectional by 0.5 marks", "heartbroken", "close_up"),
            ("arjun_mock_portal_glitch_panic", "Arjun staring in horror as mock test website shows 502 Bad Gateway with 20 minutes left", "panicked", "medium_shot"),
            ("arjun_mouse_double_click_wrong_option", "Arjun accidentally double clicking option C when he clearly solved and got option B", "furious", "close_up"),
            ("arjun_scrolling_endless_leaderboard_pages", "Arjun scrolling page 48 of test series leaderboard trying to find his own name", "depressed", "medium_shot"),
            ("arjun_rough_sheet_space_ran_out", "Arjun writing calculations in microscopic 2mm font because rough pad has zero space left", "cramped", "close_up"),
            ("arjun_nervous_sweat_on_glasses_mock", "Arjun adjusting glasses with trembling sweaty fingers during the last 10 minutes of mock", "sweaty", "close_up"),
            ("arjun_realizing_attempted_easy_question_last", "Arjun discovering question 65 was a 5-second formula gift that he never had time to see", "regretful", "close_up"),
            ("arjun_mock_test_fatigue_hour_three", "Arjun slumping in chair at hour 2.5 of mock test brain completely exhausted and drained", "drained", "medium_shot"),
            ("arjun_overthinking_simple_two_mark_question", "Arjun convincing himself a simple formula question must be a trick question and changing answer", "paranoid", "close_up"),
            ("arjun_nat_question_range_missed_by_point_one", "Arjun answer 45.2 outside official answer range 45.5 to 46.0 by fraction of decimal", "crushed", "close_up"),
            ("arjun_msq_missed_one_checkbox", "Arjun selecting options A and B in MSQ question but forgetting option D was also correct", "frustrated", "close_up"),
            ("arjun_mock_rank_comparison_chart_dip", "Arjun looking at weekly progress graph taking a steep downward dive like a roller coaster", "dismayed", "medium_shot"),
            ("arjun_calculating_probable_gate_score_fifty", "Arjun plugging raw score 48 into rank predictor seeing estimated rank 8000", "panicked", "close_up"),
            ("arjun_question_palette_all_red_palette", "Arjun looking at onscreen question palette grid where 40 boxes are glowing red unattempted", "terrified", "medium_shot"),
            ("arjun_holding_mock_printout_in_tears", "Arjun holding test analysis printout half laughing half crying at silly calculation blunders", "emotional", "medium_shot"),
            ("arjun_typing_in_wrong_nat_input_box", "Arjun entering answer of question 12 into question 13 text box by mistake", "horrified", "close_up"),
            ("arjun_mock_speed_too_slow_twenty_questions", "Arjun clock showing 90 minutes passed and only 22 questions attempted so far", "stressed", "medium_shot"),
            ("arjun_mock_subject_zero_marks", "Arjun looking at test summary seeing zero marks in Engineering Mathematics section", "stunned", "close_up"),
            ("arjun_mock_analysis_pie_chart_sixty_percent_red", "Arjun looking at pie chart where wrong answers and unattempted occupy 70 percent area", "depressing", "medium_shot"),
            ("arjun_topper_solution_video_five_seconds", "Arjun watching solution video where topper solves in 10 seconds what took him 15 minutes", "humbled", "close_up"),
            ("arjun_exam_hall_clock_visual_pressure", "Arjun looking at large digital clock counting down seconds 00:05:42 with red glow", "pressured", "close_up"),
            ("arjun_mock_negative_marks_greater_than_positive", "Arjun realizing negative marks in section B completely wiped out section A positive score", "disbelieving", "close_up"),
            ("arjun_mock_test_room_pin_drop_silence", "Arjun sitting in quiet study corner feeling his own rapid heartbeat during mock countdown", "tense", "medium_shot"),
            ("arjun_clicking_submit_with_heavy_heart", "Arjun hovering cursor over final submit test button with trembling finger and dread", "dreading", "close_up"),
            ("arjun_staring_at_immediate_score_card", "Arjun staring blankly at immediate post-test score screen displaying 34.67 marks", "numb", "close_up"),
            ("arjun_mock_mistakes_color_coded_highlighter", "Arjun highlighting calculation errors in pink and conceptual errors in yellow", "methodical", "medium_shot"),
            ("arjun_promising_myself_next_mock_better", "Arjun holding fist to heart saying agle mock test mein 65 plus laake dikhaunga", "determined", "close_up"),
            ("arjun_mock_test_headache_coffee_refill", "Arjun pouring fourth coffee cup with throbbing temple headache after 3-hour mock marathon", "exhausted", "medium_shot"),
            ("arjun_reviewing_question_he_knew_how_to_solve", "Arjun realizing he knew the exact solution but panic made him freeze in the moment", "self_blame", "close_up"),
            ("arjun_mock_test_rank_vs_aspirations_gap", "Arjun looking at PSU recruitment cutoffs vs his mock rank feeling the huge gap", "somber", "medium_shot"),
            ("arjun_questioning_entire_revision_strategy", "Arjun staring at wall realizing reading textbooks passively was a total waste of months", "epiphany", "close_up"),
            ("arjun_mock_percentile_comparison_with_last_year", "Arjun realizing same marks last year had 98 percentile but this year competition is insane", "shocked", "close_up"),
            ("arjun_mock_test_laptop_screen_burn", "Arjun blinking eyes weary from 3 hours of staring at bright high-contrast test interface", "eyestrain", "close_up"),
            ("arjun_mock_test_rough_paper_origami", "Arjun nervously folding rough paper into tiny origami crane during mock test frustration", "bored_anxious", "medium_shot"),
            ("arjun_mock_test_unanswered_questions_guilt", "Arjun staring at list of 25 unattempted questions feeling intense academic guilt", "guilty", "medium_shot"),
            ("arjun_mock_test_re_attempt_determination", "Arjun cracking knuckles determined to re-attempt the entire paper as an un-timed practice", "resilient", "medium_shot"),
            ("arjun_mock_scorecard_shared_with_mentor", "Arjun reluctantly sending screenshot of low mock score to mentor Priya asking for rescue", "humble", "close_up"),
        ]
    },
    {
        "category": "hostel_and_college_life",
        "character": "arjun",
        "fallback": "scenes/scene1_arjun_desk.jpg",
        "mouth": "ARJUN_DEFAULT_MOUTH",
        "setting": "college_canteen",
        "themes": [
            ("arjun_canteen_cutting_chai_debate", "Arjun in college canteen arguing intensely with friends about expected cutoff over chai", "heated", "medium_shot"),
            ("arjun_hostel_roommate_sleeping_peacefully", "Arjun studying at 3 AM looking at roommate sleeping peacefully with zero exam stress", "jealous", "wide"),
            ("arjun_late_night_maggie_study_break", "Arjun eating steaming 2-minute Maggie from hostel kettle while reviewing formula flashcards", "cozy_study", "medium_shot"),
            ("arjun_library_seat_reservation_fight", "Arjun standing in college library at 8 AM seeing every single seat reserved with water bottles", "annoyed", "medium_shot"),
            ("arjun_hostel_corridor_cricket_noise", "Arjun wearing earplugs trying to study while hostel corridor erupts in midnight cricket match", "disturbed", "medium_shot"),
            ("arjun_canteen_dosa_with_formula_napkin", "Arjun scribbling integration by parts formulas on a paper canteen napkin over masala dosa", "inventive", "close_up"),
            ("arjun_hostel_warden_inspection_books_hide", "Arjun hastily hiding immersion water rod behind huge stack of GATE books during inspection", "sneaky", "medium_shot"),
            ("arjun_borrowing_class_notes_xerox_shop", "Arjun waiting in long sweaty queue at college campus Xerox photocopy shop for topper notes", "impatient", "medium_shot"),
            ("arjun_library_silence_stomach_growl", "Arjun blushing in quiet library study hall as his empty stomach makes an audible rumble", "embarrassed", "close_up"),
            ("arjun_canteen_tea_stall_bhia_advice", "Arjun listening to tea stall bhaiya giving philosophical advice: babu tension mat lo sab ho jayega", "amused", "medium_shot"),
            ("arjun_hostel_wifi_speed_zero_mbps", "Arjun staring at spinning loading circle on test portal because hostel WiFi dropped to 20 KBps", "furious", "close_up"),
            ("arjun_college_canteen_alumni_psu_meet", "Arjun wide-eyed listening to senior who cracked ONGC via GATE telling campus placement secrets", "inspired", "medium_shot"),
            ("arjun_mess_food_inedible_study_hunger", "Arjun staring at tasteless hostel mess daal eating dry biscuits while solving thermodynamics", "melancholy", "medium_shot"),
            ("arjun_library_corner_secret_study_spot", "Arjun tucked away in remote corner behind dusty 1980s journals having found a quiet haven", "peaceful", "medium_shot"),
            ("arjun_hostel_room_walls_covered_in_charts", "Arjun hostel room walls completely plastered with handwritten formula charts and sticky notes", "obsessed", "wide"),
            ("arjun_group_study_turned_into_movie_night", "Arjun watching planned group study session derail into discussing Marvel movies for 3 hours", "resigned", "medium_shot"),
            ("arjun_washing_face_hostel_washbasin", "Arjun splashing cold water on face in communal hostel washbasin at 4 AM to fight sleep", "fighting_sleep", "medium_shot"),
            ("arjun_borrowing_calculator_before_semester", "Arjun desperately searching hostel rooms trying to borrow scientific calculator 991ES", "desperate", "medium_shot"),
            ("arjun_sharing_hotspot_with_roommate", "Arjun begging roommate for 500 MB mobile data hotspot to download mock test answer key", "pleading", "close_up"),
            ("arjun_hostel_balcony_sunset_deep_breath", "Arjun standing on hostel balcony at sunset taking deep breath after 8 hours of non-stop study", "refreshing", "medium_shot"),
            ("arjun_sleeping_with_book_on_chest", "Arjun knocked out asleep on hostel bed with heavy hardcover control systems book on his chest", "exhausted", "wide"),
            ("arjun_college_canteen_bunking_lab_to_study", "Arjun hiding in canteen corner during afternoon lab session solving previous year questions", "guilty_focus", "medium_shot"),
            ("arjun_hostel_birthday_celebration_escape", "Arjun sneaking out of noisy hostel corridor birthday celebration back into quiet study corner", "dedicated", "medium_shot"),
            ("arjun_wearing_blanket_like_superhero_cape", "Arjun shivering in cold December night wrapped in hostel blanket studying at desk", "determined_cold", "medium_shot"),
            ("arjun_studying_on_hostel_terrace", "Arjun walking pacing on breezy hostel rooftop memorizing formulas under the open night sky", "solitary", "wide"),
            ("arjun_canteen_samosa_bill_math_calc", "Arjun mentally applying permutations and combinations to figure out how to split canteen bill", "nerdy", "close_up"),
            ("arjun_library_card_overdue_fine_shock", "Arjun looking at 350 rupee library overdue fine receipt for a textbook he forgot to return", "stunned", "close_up"),
            ("arjun_hostel_room_desk_lamp_only_light", "Wide shot of dark hostel building where Arjun's window is the single yellow light glowing at 3 AM", "solitary_grind", "wide"),
            ("arjun_exam_admit_card_printout_laminating", "Arjun lovingly laminating his fresh GATE exam admit card printout like an Olympic medal", "proud", "close_up"),
            ("arjun_hostel_packing_bag_exam_day", "Arjun packing transparent exam pouch with admit card, original ID, and black ballpoint pens", "prepared", "medium_shot"),
            ("arjun_college_senior_giving_topper_pen", "Senior handing Arjun lucky Parker pen saying ye pen maine GATE crack karne mein use kiya tha", "blessed", "close_up"),
            ("arjun_canteen_friends_wishing_good_luck", "Canteen friends giving Arjun fist bumps and cheering him on before departure to test city", "encouraged", "medium_shot"),
            ("arjun_hostel_roommate_offering_midnight_tea", "Roommate quietly placing a hot cup of tea on Arjun's study desk without saying a word", "brotherhood", "medium_shot"),
            ("arjun_looking_at_college_campus_gate", "Arjun walking past college main gate realizing four years are ending and career begins now", "sentimental", "medium_shot"),
            ("arjun_hostel_mirror_giving_pep_talk", "Arjun looking at himself in hostel mirror fixing collar: Tu topper banega, bas focus mat hila", "self_motivation", "close_up"),
            ("arjun_studying_in_crowded_metro_train", "Arjun holding onto metro handrail reading Aspirant Arcade flashcards on phone during commute", "multitasking", "medium_shot"),
            ("arjun_canteen_bench_lying_down_tired", "Arjun resting head on wooden canteen bench between two tough classes completely wiped out", "tired", "medium_shot"),
            ("arjun_hostel_storing_water_bucket_study", "Arjun filling emergency bucket of water in hostel bathroom while reciting fluid equations", "multitasking", "medium_shot"),
            ("arjun_wearing_college_hoodie_nostalgia", "Arjun zipping up college technical fest hoodie remembering the good times before exam season", "nostalgic", "close_up"),
            ("arjun_library_closing_bell_leaving", "Librarian ringing closing bell at 10 PM as Arjun packs bag as the very last student to leave", "dedicated", "medium_shot"),
            ("arjun_hostel_room_poster_iit_bombay", "Arjun looking at poster of IIT Bombay main building on his hostel wall drawing inspiration", "aspirational", "close_up"),
            ("arjun_eating_paratha_with_single_hand", "Arjun holding butter paratha in left hand while solving double integral with right hand pen", "hungry_scholar", "medium_shot"),
            ("arjun_hostel_staircase_phone_call_parents", "Arjun sitting on quiet hostel staircase talking to parents with soft emotional smile", "comforted", "medium_shot"),
            ("arjun_walking_in_rain_with_protected_notes", "Arjun walking through campus rain holding plastic file folder tight to keep notes bone dry", "protective", "medium_shot"),
            ("arjun_canteen_bhaiya_free_extra_chai", "Tea stall bhaiya pouring an extra free cutting chai: Babu rank nikalna, chai meri taraf se", "grateful", "medium_shot"),
            ("arjun_hostel_room_calendar_crossing_days", "Arjun striking off today's date with bold red marker: One more day of grind conquered", "ticking_clock", "close_up"),
            ("arjun_sitting_on_hostel_lawn_sunshine", "Arjun revising short notes sitting on green college campus lawn during pleasant winter afternoon", "peaceful_revision", "wide"),
            ("arjun_hostel_almirah_door_formula_cheat", "Arjun opening metal hostel almirah with inner door completely covered in formula sticky notes", "secret_arsenal", "medium_shot"),
            ("arjun_college_corridor_walking_with_mentor", "Arjun and Priya walking down college academic corridor discussing mock test strategy", "strategic_duo", "medium_shot"),
            ("arjun_hostel_terrace_stargazing_dreams", "Arjun sitting on hostel terrace edge looking at stars dreaming of cracking his dream PSU", "visionary", "wide"),
        ]
    },
    {
        "category": "mentor_priya_interventions",
        "character": "priya",
        "fallback": "scenes/scene2_priya_desk.jpg",
        "mouth": "PRIYA_DEFAULT_MOUTH",
        "setting": "study_desk",
        "themes": [
            ("priya_arms_crossed_smirking", "Priya standing confidently with arms crossed and a witty smirk calling out Arjun's excuses", "smug_mentor", "medium_shot"),
            ("priya_pointing_to_laptop_confident", "Priya pointing decisively at laptop monitor where Aspirant Arcade is glowing with 10+ game modes", "confident", "medium_shot"),
            ("priya_snatching_phone_away", "Priya smoothly reaching down and confiscating Arjun's phone while he was mindlessly doomscrolling", "firm", "medium_shot"),
            ("priya_tapping_watch_disapproving", "Priya tapping her smart watch with raised eyebrow gesturing two full hours were wasted", "strict", "medium_shot"),
            ("priya_showing_tablet_gamification", "Priya holding up a tablet screen showing Formula Master and Speed Arena badges with enthusiastic grin", "enthusiastic", "close_up"),
            ("priya_leaning_over_desk_encouraging", "Priya leaning warmly over Arjun's desk reassuring him with a kind smile that anxiety is beatable", "supportive", "over_the_shoulder"),
            ("priya_eureka_finger_snap", "Priya snapping fingers with wide bright eyes as she shares the ultimate study hack with Arjun", "excited", "close_up"),
            ("priya_witty_side_eye", "Priya giving an iconic sassy side-eye expression after Arjun claims he was studying on Instagram", "sassy", "close_up"),
            ("priya_hand_on_hip_lecturing", "Priya with hand on hip giving real talk: Books ratne se rank nahi banti, active recall chahiye!", "authoritative", "medium_shot"),
            ("priya_holding_notes_challenging", "Priya holding up a question flashcard playfully challenging Arjun: Chal bata iska formula agar dum hai!", "competitive", "medium_shot"),
            ("priya_sliding_laptop_in_front", "Priya smoothly sliding a glowing laptop right under Arjun's hands: Ye le, pehle 5 minute game khelke dekh", "smooth", "medium_shot"),
            ("priya_waving_hand_arjun_face", "Priya waving hand playfully across Arjun's dazed face to snap him out of his panic daydream", "playful", "close_up"),
            ("priya_pointing_finger_boss_mode", "Priya pointing directly at camera in full boss mode: Rule number one: No more passive reading", "boss_mode", "close_up"),
            ("priya_thumbs_up_reassurance", "Priya flashing a confident warm thumbs up: Tu kar lega, bas strategy change karni hai", "encouraging", "close_up"),
            ("priya_shaking_head_amused", "Priya gently shaking head with an amused smile at Arjun's over-dramatic exam complaints", "amused", "medium_shot"),
            ("priya_slamming_laptop_friendly", "Priya gently closing Arjun's 800-page paper textbook: Bas bohot ho gaya theory, ab practice shuru", "decisive", "medium_shot"),
            ("priya_holding_coffee_rescue", "Priya handing Arjun a fresh cup of coffee: Pehle chai pi aur calm ho, main dikhati hoon kya karna hai", "caring", "medium_shot"),
            ("priya_revealing_secret_gesture", "Priya leaning closer with cupped hand as if whispering a secret topper strategy", "conspiratorial", "close_up"),
            ("priya_calculating_on_fingers", "Priya counting off benefits on her fingers: 10+ games, live 1v1 battles, daily streaks, aur free", "logical", "medium_shot"),
            ("priya_clapping_hands_action", "Priya clapping hands together briskly: Chalo rona-dhona band, battle arena mein aao!", "energetic", "medium_shot"),
            ("priya_pointing_both_index_fingers", "Priya flashing double finger guns at Aspirant Arcade logo watermark with a confident wink", "playful_cool", "close_up"),
            ("priya_nodding_knowingly", "Priya nodding knowingly: Main samajhti hoon anxiety hoti hai, par solutions bhi hote hain", "wise", "medium_shot"),
            ("priya_holding_phone_showing_reels", "Priya holding up phone displaying Focus Guard blocking reels: Ab scroll karoge toh answer dena padega!", "clever", "close_up"),
            ("priya_smug_smile_proof", "Priya giving a satisfied I told you so smile as Arjun's score jumps on screen", "smug", "close_up"),
            ("priya_looking_at_camera_relatable", "Priya turning straight to camera breaking 4th wall: Aapke saath bhi yahi hota hai na?", "relatable", "close_up"),
            ("priya_high_five_ready", "Priya holding palm high in the air waiting for Arjun to give her a high-five after streak", "anticipatory", "medium_shot"),
            ("priya_drawing_on_whiteboard_shortcuts", "Priya drawing clean diagram on whiteboard showing shortcut formula derivation", "teaching", "medium_shot"),
            ("priya_pointing_to_air_rank_target", "Priya pointing marker to top of whiteboard where AIR Under 100 is written in bold", "inspiring", "medium_shot"),
            ("priya_holding_yellow_arcade_card", "Priya holding up a golden Aspirant Arcade access card like a VIP referee", "stylish", "close_up"),
            ("priya_crossing_arms_leaning_wall", "Priya leaning casually against doorframe watching Arjun finally study with deep focus", "proud_watch", "medium_shot"),
            ("priya_gesturing_calm_down_hands", "Priya pressing palms down gently in air telling Arjun: Breathe in, breathe out, panicking won't help", "calming", "medium_shot"),
            ("priya_unrolling_mock_battle_roadmap", "Priya unrolling a colorful 30-day gamified study roadmap across the desk", "organized", "medium_shot"),
            ("priya_handing_headphones_to_arjun", "Priya handing Arjun glowing arcade headphones: Put these on and lock in for 25 minutes", "focused_action", "medium_shot"),
            ("priya_pointing_to_leaderboard_screen", "Priya tapping monitor: Look at that rank climbing! I told you gamified practice works!", "thrilled", "medium_shot"),
            ("priya_playfully_tossing_pen_to_arjun", "Priya tossing a pen to Arjun: Your turn to answer, 10 seconds on the clock!", "playful_challenge", "close_up"),
            ("priya_standing_tall_mentor_pose", "Priya standing tall in her navy blue jacket with yellow trim projecting total confidence", "commanding", "medium_shot"),
            ("priya_offering_high_five_after_solve", "Priya reaching across desk for instant high five after Arjun nails a tricky 2-mark question", "jubilant", "close_up"),
            ("priya_rolling_eyes_at_silly_excuse", "Priya rolling eyes affectionately: You had time for 40 reels but no time for 5 questions?", "teasing", "close_up"),
            ("priya_whispering_cheat_code_mnemonic", "Priya leaning in whispering: Remember this word: V-I-C-E for thermodynamics signs", "clever_secret", "close_up"),
            ("priya_holding_timer_buzzer", "Priya holding arcade buzzer button: 30 seconds speed round begins... NOW!", "game_show_host", "close_up"),
            ("priya_showing_accuracy_percentage_jump", "Priya pointing at analytics graph showing Arjun accuracy jump from 45 percent to 88 percent", "triumphant", "medium_shot"),
            ("priya_giving_two_thumbs_up_proud", "Priya beaming with genuine sisterly/mentor pride giving double thumbs up to Arjun", "delighted", "close_up"),
            ("priya_handing_aspirant_arcade_water_bottle", "Priya handing Arjun branded water bottle: Stay hydrated, champion, next round starts", "caring_coach", "medium_shot"),
            ("priya_folding_arms_demanding_answers", "Priya folding arms with intense focus: Explain that theorem back to me in your own words", "feynman_technique", "medium_shot"),
            ("priya_celebrating_streak_with_fist_pump", "Priya fist pumping beside monitor: 15-day streak unlocked! You're officially unstoppable!", "hyped", "close_up"),
            ("priya_breaking_down_complex_formula_lines", "Priya using two fingers to separate a 4-term formula into 2 simple relatable concepts", "clarity", "close_up"),
            ("priya_waving_flag_at_finish_line", "Priya playfully waving checkered victory flag at Arjun desk as mock test completes", "festive", "medium_shot"),
            ("priya_adjusting_arjun_study_lamp", "Priya angling warm desk lamp to illuminate rough sheet: Proper lighting, sharp mind", "attentive", "medium_shot"),
            ("priya_direct_eye_contact_final_advice", "Priya looking straight into camera lens: Stop doubting yourself. Open the app and start today", "sincere_hook", "close_up"),
            ("priya_saluting_arjun_hard_work", "Priya playfully saluting Arjun after he finishes a 2-hour arcade grind session", "respectful_mentor", "medium_shot"),
        ]
    },
    {
        "category": "arcade_modes_gameplay",
        "character": "screen",
        "fallback": "scenes/scene3_phone_intervention.jpg",
        "mouth": "None",
        "setting": "laptop_pov",
        "themes": [
            ("screen_formula_master_combo_10x", "Vibrant neon UI of Formula Master showing rapid formula-matching and 10x multiplier particles", "high_energy", "screen_focus"),
            ("screen_speed_arena_1v1_battle", "1v1 Live Battle HUD in Speed Arena: Arjun on left vs Rival on right with timer bar racing down", "competitive", "screen_focus"),
            ("screen_focus_guard_gate_lock", "Smartphone screen showing Instagram feed paused with futuristic lock card asking GATE question", "intervention", "screen_focus"),
            ("screen_boss_battle_quiz_runner", "Retro arcade Boss Battle screen: Boss Master of Thermodynamics taking damage with correct answer", "epic_gaming", "screen_focus"),
            ("screen_leaderboard_rank_jump", "Live leaderboard animation showing Arjun avatar jumping up 300 ranks into Top 10", "triumphant", "screen_focus"),
            ("screen_arcade_mode_carousel", "Dynamic 3D carousel showcasing 10+ game modes with glowing neon arcade cartridges", "vibrant", "screen_focus"),
            ("screen_daily_streak_fire_badge", "Flaming 14-day study streak badge popping on screen with celebratory sound effect", "rewarding", "screen_focus"),
            ("screen_formula_flashcard_flip", "3D flashcard card cleanly flipping over in mid-air revealing formula breakdown mnemonic", "educational", "screen_focus"),
            ("screen_concept_radar_chart", "Visual 6-point radar polygon chart showing strengths and weaknesses across syllabus", "analytical", "screen_focus"),
            ("screen_victory_stars_3x", "Three giant gold stars dropping down onto screen with celebratory chime and confetti", "celebration", "screen_focus"),
            ("screen_instant_solution_breakdown", "Clean 2-step visual solution breakdown showing shortcut trick to solve question in 20 seconds", "clarity", "screen_focus"),
            ("screen_multiplayer_matchmaking", "Live matchmaking radar pulse finding rival aspirant from IIT Delhi for instant 60s quiz battle", "thrilling", "screen_focus"),
            ("screen_xp_level_up_unlocked", "Glittering badge animation: LEVEL UP! Rank Tier 4 Engineering Mechanics Master Unlocked", "achievement", "screen_focus"),
            ("screen_offline_mode_ready", "Clean badge: 100 percent Free • Play On Metro & Bus • Zero Ads • No Distractions", "practical", "screen_focus"),
            ("screen_speed_timer_ticking", "Dynamic 15-second radial countdown timer pulsing gold to red testing rapid formula recall", "urgent", "screen_focus"),
            ("screen_bug_hunter_code_quiz", "Aspirant Arcade Bug Hunter mode: Spot the runtime bug in C/C++ data structures snippet", "coding_focus", "screen_focus"),
            ("screen_virtual_calculator_mastery", "Interactive virtual calculator trainer teaching students keyboard shortcuts for exam hall", "technical", "screen_focus"),
            ("screen_psu_badge_ongc_unlocked", "Digital badge unlock: ONGC Graduate Trainee Qualifying Score Milestone Reached", "prestigious", "screen_focus"),
            ("screen_coin_drop_animation", "Shower of golden arcade coins dropping into student digital wallet after flawless streak", "rewarding", "screen_focus"),
            ("screen_combo_multiplier_fire", "Text graphic COMBO x25 ON FIRE erupting with animated sparks and crowd cheering FX", "explosive", "screen_focus"),
            ("screen_daily_challenge_countdown", "Daily Exam Challenge card: 10 Questions, 5 Minutes, Winner gets Double XP", "competitive", "screen_focus"),
            ("screen_weakness_heatmap_green", "Syllabus heatmap turning from red to bright emerald green as weak topics are mastered", "satisfying", "screen_focus"),
            ("screen_flashcard_swipe_right", "Hand swiping right on formula card with satisfying green checkmark particle explosion", "interactive", "screen_focus"),
            ("screen_clash_of_aspirants_clan_war", "College vs College Clan War leaderboard: IIT Roorkee vs NIT Trichy head-to-head", "rivalry", "screen_focus"),
            ("screen_boss_defeat_explosion", "Giant mechanical exam boss shattering into pieces as final numerical answer submitted", "victorious", "screen_focus"),
            ("screen_question_difficulty_level_three", "Question banner: Difficulty Tier: HARD • GATE Previous Year Question with 92% failure rate", "challenging", "screen_focus"),
            ("screen_time_per_question_record", "Record breaking speed badge: Question solved in 4.2 seconds! New Personal Best!", "fast", "screen_focus"),
            ("screen_accuracy_graph_ninety_five", "Smooth line chart soaring from 40 percent to 95 percent accuracy across 30 days", "growth", "screen_focus"),
            ("screen_subject_trophy_case", "Virtual trophy shelf holding gold trophies for Calculus, Thermodynamics, and Networks", "collector", "screen_focus"),
            ("screen_live_duel_sudden_death", "SUDDEN DEATH ROUND banner flashing in 1v1 battle: One mistake means game over", "high_stakes", "screen_focus"),
            ("screen_streak_freeze_shield", "Focus Guard streak shield protecting 20-day streak from breaking after busy college day", "protective", "screen_focus"),
            ("screen_custom_mock_builder", "Custom Mock Builder screen: Pick 5 topics, set 30 minutes, generate instant exam-level quiz", "customizable", "screen_focus"),
            ("screen_peer_comparison_percentile", "Percentile speedometer dial needle spinning from 60 to 99.4 Percentile with neon glow", "impressive", "screen_focus"),
            ("screen_formula_audio_pronunciation", "Audio waveform pulsing showing correct pronunciation and mnemonic audio for formulas", "auditory", "screen_focus"),
            ("screen_dark_mode_arcade_glow", "Sleek AMOLED dark mode interface with neon yellow accents designed for late-night grind", "aesthetic", "screen_focus"),
            ("screen_friend_challenge_whatsapp_link", "Share challenge link button: Challenge your study group to beat your 850 score", "viral", "screen_focus"),
            ("screen_rapid_fire_buzzer_round", "Round 3 RAPID FIRE: 5 questions in 30 seconds testing instinctual concept recall", "fast_paced", "screen_focus"),
            ("screen_smart_bookmark_revision_deck", "Auto-generated Smart Bookmark deck holding the 12 questions Arjun previously got wrong", "smart_learning", "screen_focus"),
            ("screen_daily_login_gift_chest", "Wooden treasure chest opening with golden light revealing 50 free arcade tokens", "rewarding", "screen_focus"),
            ("screen_avatar_customization_jackets", "Arjun and Priya 3D low-poly avatar shop wearing navy and yellow team hoodies", "custom_avatars", "screen_focus"),
            ("screen_offline_sync_indicator", "100 Questions downloaded for offline play: Ready for flight, train, or zero network", "offline_ready", "screen_focus"),
            ("screen_gate_cutoff_predictor_live", "Live percentile vs rank calculator displaying estimated rank 214 for GATE 2026", "predictive", "screen_focus"),
            ("screen_interactive_circuit_canvas", "Interactive drag-and-drop circuit simulator solving for Thevenin equivalent resistance", "hands_on", "screen_focus"),
            ("screen_formula_quiz_runner_lane", "3D running character jumping over false formula hurdles and collecting true equations", "runner_game", "screen_focus"),
            ("screen_all_india_quiz_marathon", "MEGA QUIZ EVENT: 10,000 Aspirants live in Sunday National Mock Test Arena", "national_event", "screen_focus"),
            ("screen_answer_confidence_meter", "Confidence meter slider: High, Medium, Low helping identify lucky guesses vs true mastery", "metacognition", "screen_focus"),
            ("screen_step_by_step_diagram_draw", "Animated 2D vector diagram drawing free body diagram forces with labeled arrows", "didactic", "screen_focus"),
            ("screen_badge_collection_wall", "Wall of 40 hexagonal achievement badges lighting up in gold, silver, and diamond", "badges_wall", "screen_focus"),
            ("screen_gameplay_victory_fanfare", "Dynamic confetti shower with giant text WINNER! YOU DEFEATED EXAM ANXIETY", "jubilation", "screen_focus"),
            ("screen_app_store_five_star_rating", "Google Play Store rating modal showing 4.9 stars from 5,000+ happy GATE aspirants", "social_proof", "screen_focus"),
        ]
    },
    {
        "category": "focus_guard_and_habit_breaking",
        "character": "arjun",
        "fallback": "scenes/scene3_phone_intervention.jpg",
        "mouth": "ARJUN_DEFAULT_MOUTH",
        "setting": "phone_pov",
        "themes": [
            ("arjun_screen_time_report_five_hours", "Arjun staring in horror at iPhone screen time report showing 5 hours 14 mins on social apps", "horrified", "close_up"),
            ("arjun_phone_locked_by_focus_guard", "Arjun trying to open Instagram but Aspirant Arcade Focus Guard shield pops up with GATE MCQ", "interrupted", "medium_shot"),
            ("arjun_solving_question_to_unlock_reel", "Arjun quickly solving a 1-mark question on phone to unlock his next 3 study reward reels", "focused", "close_up"),
            ("arjun_putting_phone_in_drawer_lock", "Arjun placing phone inside wooden study desk drawer and turning the metal key with a smile", "disciplined", "medium_shot"),
            ("arjun_phone_face_down_zen_mode", "Arjun turning phone screen face down on wooden desk table with calm zen determination", "zen", "close_up"),
            ("arjun_deleted_social_media_celebration", "Arjun pressing delete app confirmation popup smiling with freedom from doomscrolling", "liberated", "close_up"),
            ("arjun_screen_time_dropped_to_thirty_mins", "Arjun smiling proudly at weekly analytics showing screen time plunged by 80 percent", "proud", "close_up"),
            ("arjun_focus_timer_ring_glowing_gold", "Arjun looking at 50-minute Pomodoro focus ring on desk timer glowing soothing warm gold", "focused", "close_up"),
            ("arjun_catching_himself_reaching_for_phone", "Arjun reaching for phone by muscle memory stopping mid-air and pulling hand back to book", "mindful", "medium_shot"),
            ("arjun_dnd_mode_activated_phone", "Arjun toggling Do Not Disturb mode on smartphone screen with icon of small crescent moon", "peaceful", "close_up"),
            ("arjun_studying_without_single_notification", "Arjun experiencing deep uninterrupted flow state for 3 straight hours without alerts", "deep_flow", "medium_shot"),
            ("arjun_turning_reels_into_ranks_realization", "Arjun eyes wide realizing: Har reel ki jagah ek question solve karun toh roz 100 questions hote hain!", "epiphany", "close_up"),
            ("arjun_unfollowing_distraction_meme_pages", "Arjun unfollowing random comedy meme accounts and following Aspirant Arcade daily quiz", "decluttering", "close_up"),
            ("arjun_phone_charging_in_another_room", "Arjun leaving smartphone charging in hallway while studying in bedroom with zero temptation", "strategic", "medium_shot"),
            ("arjun_focus_guard_streak_badge_unlocked", "Arjun unlocking 7 Days No Doomscrolling golden shield badge on his profile", "triumphant", "close_up"),
            ("arjun_reading_physical_book_peace", "Arjun holding real paper book turning pages with genuine peaceful analog focus", "tranquil", "medium_shot"),
            ("arjun_hostel_room_no_phones_study_club", "Arjun and friends placing all phones in a basket in center of room during study session", "solidarity", "medium_shot"),
            ("arjun_focus_guard_quiz_correct_chime", "Arjun tapping correct answer on lock screen hearing the crisp green unlock chime", "satisfied", "close_up"),
            ("arjun_replacing_morning_scroll_with_quiz", "Arjun waking up at 7 AM and immediately playing 5-minute Formula Master instead of Instagram", "morning_routine", "medium_shot"),
            ("arjun_brain_fog_cleared_after_detox", "Arjun taking deep breath feeling mental clarity and memory recall sharply improved", "clear_headed", "close_up"),
            ("arjun_night_mode_warm_amber_reading", "Arjun reading notes under warm amber desk lamp with zero blue light screen distraction", "restful", "medium_shot"),
            ("arjun_writing_daily_goals_on_sticky_pad", "Arjun writing 3 concrete goals on yellow post-it note: 40 Questions, 2 Chapters, 0 Reels", "intentional", "close_up"),
            ("arjun_crossing_off_distraction_triggers", "Arjun checking off his daily productivity checklist with dark green felt tip marker", "accomplished", "medium_shot"),
            ("arjun_laughing_at_old_screen_time_addiction", "Arjun laughing with Priya remembering when he used to waste 3 hours on mindless reels", "amused_growth", "medium_shot"),
            ("arjun_phone_battery_full_at_end_of_day", "Arjun surprised to see phone battery still at 78 percent at 9 PM because he was studying all day", "shocked_happy", "close_up"),
            ("arjun_focus_guard_widget_on_home_screen", "Arjun home screen showing Aspirant Arcade daily question widget instead of Instagram icon", "custom_home", "close_up"),
            ("arjun_focus_mode_ambient_rain_sounds", "Arjun listening to gentle rain background audio on headphones while solving mechanics", "serene", "medium_shot"),
            ("arjun_celebrating_first_week_phone_detox", "Arjun high-fiving himself in bathroom mirror after 7 days of strict Focus Guard discipline", "confident", "medium_shot"),
            ("arjun_ignoring_whatsapp_group_drama", "Arjun seeing college gossip group buzzing with 300 messages and calmly putting phone away", "unbothered", "medium_shot"),
            ("arjun_choosing_arcade_battle_over_reels", "Arjun choosing to play 1v1 Speed Arena during tea break instead of scrolling brain-rot reels", "smart_choice", "medium_shot"),
            ("arjun_focus_guard_stats_sharing_instagram", "Arjun sharing his 14-day zero doomscrolling badge on his Instagram story", "social_brag", "close_up"),
            ("arjun_deep_work_session_desk_sign", "Arjun hanging small paper sign on hostel door: Deep Work in progress, knock only for emergencies", "serious", "medium_shot"),
            ("arjun_mental_battery_recharged", "Arjun feeling energetic and sharp at end of study evening instead of drained and anxious", "invigorated", "close_up"),
            ("arjun_putting_phone_in_timed_lockbox", "Arjun locking phone inside clear timed acrylic kitchen safe box set for 2 hours", "extreme_discipline", "medium_shot"),
            ("arjun_focus_guard_shield_blocking_youtube", "Arjun clicking YouTube icon but Focus Guard overlaying: Solve this Thermodynamics question first!", "intercepted", "close_up"),
            ("arjun_answering_formula_with_one_hand", "Arjun answering Formula Master question on phone while waiting for college bus", "micro_study", "medium_shot"),
            ("arjun_focus_guard_weekly_summary_card", "Focus Guard report: You converted 14 hours of reel doomscrolling into 420 exam questions!", "impressive", "close_up"),
            ("arjun_sleeping_peacefully_without_phone", "Arjun sleeping peacefully at 11 PM with phone kept in another room, insomnia completely gone", "peaceful_sleep", "wide"),
            ("arjun_waking_up_refreshed_morning", "Arjun stretching arms in morning sunlight feeling refreshed and excited to study", "morning_energy", "medium_shot"),
            ("arjun_focus_guard_custom_app_blocker", "Arjun adding Instagram, Snapchat, and YouTube to Focus Guard auto-quiz protection list", "proactive", "close_up"),
            ("arjun_study_streak_twenty_one_days_habit", "Arjun looking at 21-day habit calendar realizing study has become effortless automatic routine", "habit_formed", "medium_shot"),
            ("arjun_feeling_proud_of_willpower", "Arjun smiling with genuine self-respect having conquered his smartphone addiction", "self_respect", "close_up"),
            ("arjun_focus_guard_notification_praise", "Phone notification: Fantastic job Arjun! 100 percent Focus Guard goal achieved today!", "encouraging", "close_up"),
            ("arjun_talking_to_junior_about_focus_guard", "Arjun explaining Focus Guard app feature to college junior over canteen tea", "advocate", "medium_shot"),
            ("arjun_mindful_tea_drinking_no_screen", "Arjun enjoying hot cup of chai looking at greenery outside without touching any screen", "mindful", "medium_shot"),
            ("arjun_focus_guard_lockscreen_wallpaper", "Arjun phone wallpaper: Every minute you scroll, someone else is solving a GATE question", "motivational", "close_up"),
            ("arjun_overcoming_fomo_fear_of_missing_out", "Arjun shrugging at social media FOMO knowing that a top PSU job is worth the temporary sacrifice", "mature", "close_up"),
            ("arjun_focus_guard_daily_xp_multiplier", "XP bonus indicator: Zero Social Media Distraction today! Earned 2x XP multiplier on all games!", "gamified_reward", "close_up"),
            ("arjun_turning_off_phone_before_mock_test", "Arjun pressing power off on phone with definitive click 15 minutes before mock begins", "resolute", "medium_shot"),
            ("arjun_focus_guard_champion_badge_profile", "Arjun profile badge: FOCUS GUARD MASTER • 30 Days Unbroken Study Habit", "legendary", "close_up"),
        ]
    },
    {
        "category": "pvp_battles_and_community",
        "character": "both",
        "fallback": "scenes/scene4_arjun_victory.jpg",
        "mouth": "ARJUN_DEFAULT_MOUTH",
        "setting": "arcade_room",
        "themes": [
            ("arjun_priya_versus_screen_split", "Split-screen versus screen: Arjun on left and Priya on right ready for 1v1 Speed Battle", "competitive_duo", "medium_shot"),
            ("arjun_speed_arena_buzzer_beater", "Arjun slamming enter key with 0.4 seconds left on battle timer beating his opponent", "thrilling", "close_up"),
            ("arjun_priya_trash_talk_friendly", "Priya smirking across table playfully teasing Arjun: Ready to lose 50 rating points?", "banter", "medium_shot"),
            ("arjun_staring_at_rival_progress_bar", "Arjun watching opponent live progress bar fill up racing to submit answer first", "intense", "close_up"),
            ("arjun_celebrating_1v1_win_against_topper", "Arjun leaping up shouting YES after beating college topper in live Speed Arena duel", "euphoric", "medium_shot"),
            ("arjun_priya_analyzing_opponent_strategy", "Arjun and Priya reviewing match replay seeing how the rival solved in 8 seconds", "tactical", "medium_shot"),
            ("arjun_clan_leaderboard_college_rank_one", "Arjun showing phone screen to friends: Our college clan just hit Rank 1 in Maharashtra!", "clan_pride", "medium_shot"),
            ("arjun_rematch_button_instant_press", "Arjun furiously tapping Instant Rematch button after losing by single point in tie-breaker", "vengeful", "close_up"),
            ("arjun_priya_coaching_live_match", "Priya whispering hint over Arjun shoulder during thrilling 3-way sudden death quiz battle", "coaching_fire", "over_the_shoulder"),
            ("arjun_matchmaking_found_iit_bombay_rival", "Matchmaking notification: Matched with Rival from IIT Bombay! Stakes: 100 Rating ELO", "high_stakes", "close_up"),
            ("arjun_perfect_round_flawless_victory", "Screen flashes FLAWLESS VICTORY! 5 out of 5 questions answered with 100 percent speed", "flawless", "medium_shot"),
            ("arjun_priya_celebrating_clan_trophy", "Arjun and Priya holding imaginary giant clan war trophy laughing together in arcade room", "duo_trophy", "medium_shot"),
            ("arjun_gg_handshake_emote_sent", "Arjun sending friendly Good Game handshake emote to rival after close battle", "sportsman", "close_up"),
            ("arjun_rating_elo_crossed_two_thousand", "Arjun profile rating jumping past 2000 ELO into Grandmaster Aspirant tier", "tier_promotion", "close_up"),
            ("arjun_priya_double_laptop_battle_station", "Arjun and Priya seated side-by-side with twin laptops in sleek battle station setup", "battle_station", "wide"),
            ("arjun_photo_finish_tie_breaker_win", "Timer shows Arjun answered 0.05 seconds faster than rival taking the match victory", "clutch", "close_up"),
            ("arjun_laughing_at_funny_wrong_option", "Arjun and Priya cracking up laughing at hilarious trap option in multiple choice question", "humorous", "medium_shot"),
            ("arjun_priya_synchronous_fist_bump", "Arjun and Priya giving crisp synchronous fist bump across glowing arcade table", "teamwork", "close_up"),
            ("arjun_all_india_weekend_cup_bracket", "Tournament bracket tree showing Arjun advancing to Quarter Finals in All India Cup", "tournament", "medium_shot"),
            ("arjun_spectator_mode_watching_topper_duel", "Arjun watching live spectator stream of top two national aspirants battling in finals", "spectating", "close_up"),
            ("arjun_priya_wearing_matching_headsets", "Arjun and Priya wearing glowing neon gaming headsets communicating during clan war", "esports_vibe", "medium_shot"),
            ("arjun_underdog_victory_against_rank_ten", "Underdog victory banner: Arjun (Rank 850) defeated AIR 10 in Speed Arena duel!", "giant_slayer", "medium_shot"),
            ("arjun_custom_room_inviting_college_group", "Arjun generating custom 6-digit room PIN inviting his 4 college friends to private quiz", "host", "close_up"),
            ("arjun_priya_clapping_for_rival", "Arjun and Priya clapping respectfully after rival executes brilliant 5-second solve", "respect", "medium_shot"),
            ("arjun_live_streak_twenty_wins_glow", "Arjun profile avatar surrounded by blazing blue flame aura: 20 Live Wins in a Row", "on_fire", "close_up"),
            ("arjun_priya_high_fiving_over_table", "Arjun and Priya leaning across low coffee table slapping high five in celebration", "celebration", "medium_shot"),
            ("arjun_comeback_win_from_zero_two_down", "Arjun pulling off miracle comeback winning 3-2 after trailing 0-2 in best of five series", "miracle_comeback", "medium_shot"),
            ("arjun_sharing_battle_replay_whatsapp", "Arjun sharing dynamic battle clip replay video link to college WhatsApp group", "social_share", "close_up"),
            ("arjun_priya_strategizing_with_whiteboard", "Arjun and Priya drawing tactical quiz breakdown on whiteboard for upcoming tournament", "tacticians", "medium_shot"),
            ("arjun_crowd_cheering_sound_effect", "Arjun smiling ear-to-ear as app plays stadium crowd roar sound effect after match win", "cheered", "close_up"),
            ("arjun_clan_banner_golden_lion", "College clan banner displaying golden lion crest and slogan: Rank 1 or Nothing", "heraldry", "close_up"),
            ("arjun_priya_victory_dance_chair", "Arjun doing funny seated victory shoulder dance while Priya laughs holding her tablet", "hilarious", "medium_shot"),
            ("arjun_tie_breaker_formula_typing_speed", "Arjun fingers blurring across keyboard typing complex formula in sudden death speed round", "blazing_speed", "close_up"),
            ("arjun_ranking_jump_state_level_top_three", "Notification: Arjun is now ranked Number 3 in Karnataka in Engineering Mathematics", "state_topper", "close_up"),
            ("arjun_priya_giving_thumbs_up_to_camera_pvp", "Arjun and Priya pointing at camera: Think you can beat our streak? Challenge us on Aspirant Arcade!", "challenge_hook", "medium_shot"),
            ("arjun_rival_sending_rematch_flame_emoji", "Rival sending fire emoji and requesting instant rematch after losing by 2 points", "rivalry_alive", "close_up"),
            ("arjun_priya_sharing_headphones_audio", "Arjun and Priya sharing pair of headphones listening to question countdown audio", "intimate_teamwork", "medium_shot"),
            ("arjun_final_second_answer_submission", "Close up on Arjun mouse cursor clicking option A at 00:00:01 with green victory flash", "clutch_click", "close_up"),
            ("arjun_trophy_cabinet_national_silver_cup", "Arjun profile displaying National Runner-Up silver cup badge from Sunday Mega Cup", "prestigious", "close_up"),
            ("arjun_priya_high_energy_duo_intro", "Arjun and Priya walking toward camera in matching jackets ready to announce new tournament", "champions_intro", "wide"),
            ("arjun_climbing_to_diamond_league", "Badge explosion: CONGRATULATIONS! You advanced to DIAMOND LEAGUE in Speed Arena!", "league_promotion", "close_up"),
            ("arjun_priya_discussing_question_tricks", "Arjun and Priya reviewing tricky numerical question noting the clever trap option", "intellectual", "medium_shot"),
            ("arjun_community_forum_helpful_answer", "Arjun writing 3-line shortcut solution on Aspirant Arcade community board getting 50 upvotes", "community_hero", "close_up"),
            ("arjun_priya_laughing_at_epic_tie", "Arjun and Priya both finishing with exact same 450.0 score laughing at impossible tie", "coincidence", "medium_shot"),
            ("arjun_streak_shield_saving_elo_rating", "Shield animation saving Arjun ELO rating from dropping after close match loss", "shield_protect", "close_up"),
            ("arjun_priya_pointing_at_clan_chat", "Arjun pointing at clan chat full of fire and clapping emojis from batchmates", "camaraderie", "medium_shot"),
            ("arjun_speed_arena_buzzer_sound_joy", "Arjun pressing spacebar buzzer and hearing victory chime ring out loud and clear", "buzzer_joy", "close_up"),
            ("arjun_priya_standing_back_to_back_ready", "Arjun and Priya standing back-to-back with arms crossed ready to take on all India rivals", "heroic_stance", "medium_shot"),
            ("arjun_live_battle_heartbeat_sfx", "Visual heartbeat pulse on screen as timer ticks under 5 seconds in championship match", "adrenaline", "screen_focus"),
            ("arjun_priya_raising_hands_together_win", "Arjun and Priya raising hands together in victory salute after dominating clan tournament", "champions", "medium_shot"),
        ]
    },
    {
        "category": "breakthrough_and_eureka_moments",
        "character": "arjun",
        "fallback": "scenes/scene4_arjun_victory.jpg",
        "mouth": "ARJUN_DEFAULT_MOUTH",
        "setting": "study_desk",
        "themes": [
            ("arjun_concept_finally_clicks_eureka", "Arjun eyes lighting up with massive eureka moment as tough concept suddenly makes complete sense", "eureka", "close_up"),
            ("arjun_solving_ten_year_gate_question_fast", "Arjun solving a notoriously tough 2018 GATE question in under 45 seconds without checking answer", "mastery", "medium_shot"),
            ("arjun_two_thumbs_up_grinning_huge", "Arjun grinning ear-to-ear giving two enthusiastic thumbs up with newfound exam confidence", "super_confident", "medium_shot"),
            ("arjun_fist_pump_chair_spin_epic", "Arjun spinning in his study chair doing a massive celebratory fist pump after flawless mock", "ecstatic", "wide"),
            ("arjun_writing_solution_flawlessly", "Arjun hand writing solution smoothly on paper without pausing once for formula recall", "flow_state", "close_up"),
            ("arjun_explaining_concept_to_friend_easily", "Arjun smiling confidently explaining difficult concept to college friend in 2 simple sentences", "expert_ease", "medium_shot"),
            ("arjun_accuracy_jump_to_ninety_percent", "Arjun test analytics screen showing accuracy jumping from 42 percent to 91 percent", "astonished_pride", "close_up"),
            ("arjun_shutting_difficult_book_conquered", "Arjun shutting thick textbook with firm satisfying thud: Conquered and mastered, next topic!", "conquered", "medium_shot"),
            ("arjun_laughing_at_how_simple_it_was", "Arjun chuckling in self-deprecation: Itna simple tha aur main 3 mahine se dar raha tha!", "amused_relief", "close_up"),
            ("arjun_standing_up_stretching_champion", "Arjun standing up stretching arms wide with massive radiant smile after finishing daily target", "triumphant", "medium_shot"),
            ("arjun_speed_recall_flashcard_deck_clear", "Arjun flipping through 30 formula flashcards without missing a single equation", "flawless_recall", "medium_shot"),
            ("arjun_anxiety_completely_vanished_smile", "Close up on Arjun face peaceful, calm, and beaming with quiet inner confidence", "serene_confidence", "close_up"),
            ("arjun_looking_at_mock_score_seventy_plus", "Arjun staring at mock test result displaying 74.33 marks clearing top PSU cutoff easily", "ecstatic_shock", "close_up"),
            ("arjun_drawing_perfect_graph_freehand", "Arjun drawing a smooth perfect resonance curve on paper without even using ruler", "skilled", "close_up"),
            ("arjun_replacing_fear_with_curiosity", "Arjun leaning into tough question with excited smile: Let's see what trick this question has!", "adventurous", "close_up"),
            ("arjun_mentor_priya_nodding_in_respect", "Priya nodding with deep respect watching Arjun solve numerical with advanced shortcut", "mentor_respect", "medium_shot"),
            ("arjun_daily_study_goal_one_hundred_percent", "Screen graphic showing 100 percent Daily Goals Completed with golden checkmarks", "complete", "close_up"),
            ("arjun_writing_qed_with_flourish", "Arjun writing Q.E.D. with a playful pen flourish at bottom of difficult mathematical proof", "playful_pride", "close_up"),
            ("arjun_re-attempting_previously_failed_test", "Arjun scoring 96 percent on mock test that he failed miserably two months ago", "redemption", "medium_shot"),
            ("arjun_feeling_prepared_for_exam_day", "Arjun taking deep breath looking at calendar with zero panic and full readiness", "prepared", "medium_shot"),
            ("arjun_calculating_numerical_in_head_mental", "Arjun solving 3-step arithmetic in his head without even touching calculator", "mental_math", "close_up"),
            ("arjun_looking_at_handwritten_formula_book", "Arjun holding his finished handwritten short notes book feeling like personal masterpiece", "treasured", "close_up"),
            ("arjun_receiving_encouragement_from_parents", "Arjun showing high mock test score to parents seeing them smile with deep relief", "heartwarming", "medium_shot"),
            ("arjun_confidence_radiating_in_body_language", "Arjun sitting tall with shoulders back and sharp determined gaze ready for anything", "commanding_presence", "medium_shot"),
            ("arjun_smiling_at_exam_hall_ticket", "Arjun looking at exam admit card with genuine excitement rather than dread", "ready_for_battle", "close_up"),
            ("arjun_beating_time_limit_by_ten_minutes", "Arjun finishing 65-question mock test with 18 full minutes left for thorough revision", "ahead_of_time", "medium_shot"),
            ("arjun_helping_struggling_junior_patiently", "Arjun patiently coaching junior showing them Aspirant Arcade Formula Master hack", "mentor_role", "medium_shot"),
            ("arjun_discovering_shortcut_formula_trick", "Arjun discovering direct 1-line shortcut replacing 2-page standard derivation", "revelation", "close_up"),
            ("arjun_drinking_water_with_calm_smile", "Arjun taking sip of cool water smiling peacefully knowing syllabus is under control", "tranquil_mastery", "medium_shot"),
            ("arjun_high_fiving_himself_in_reflection", "Arjun tapping his own reflection in study room mirror: You did it brother, keep going", "self_love", "close_up"),
            ("arjun_celebrating_syllabus_fifty_percent_done", "Arjun crossing out 5th major subject on syllabus checklist: Halfway there and cruising!", "milestone", "medium_shot"),
            ("arjun_noticing_formula_comes_naturally", "Arjun writing Navier-Stokes equations from memory like reciting lyrics of favorite song", "second_nature", "close_up"),
            ("arjun_feeling_sharp_focus_in_morning", "Arjun solving numerical at 6 AM with razor-sharp morning clarity and zero fatigue", "razor_sharp", "medium_shot"),
            ("arjun_tossing_crumpled_rough_sheet_in_bin", "Arjun shooting crumpled rough sheet cleanly into dustbin like a basketball three-pointer", "celebratory_toss", "medium_shot"),
            ("arjun_watching_ranking_soar_on_app", "Arjun watching his avatar fly up into All India Top 50 on live leaderboard", "soaring", "close_up"),
            ("arjun_closing_laptop_with_deep_peace", "Arjun gently shutting laptop lid at 9:30 PM with peaceful smile, mission accomplished", "peace_of_mind", "medium_shot"),
            ("arjun_writing_all_formulas_on_blank_sheet", "Arjun doing complete active recall writing 50 formulas on blank A4 sheet without error", "flawless_recall", "medium_shot"),
            ("arjun_laughing_at_previous_fear", "Arjun looking at past exam question paper thinking: Isse main kyun darta tha? Ye toh aasan hai!", "fearless", "close_up"),
            ("arjun_mentor_priya_giving_proud_handshake", "Priya giving Arjun a firm proud professional handshake: You are exam ready, my friend", "validation", "medium_shot"),
            ("arjun_feeling_the_thrill_of_competition", "Arjun eyes sparkling with competitive fire: Bring on the exam, I am ready to dominate", "ready_to_win", "close_up"),
            ("arjun_highlighting_mastered_topics_green", "Arjun filling in syllabus tracker blocks with bright vibrant green highlighter", "satisfying_progress", "close_up"),
            ("arjun_sleeping_with_a_gentle_smile", "Arjun falling asleep with soft peaceful smile knowing tomorrow's test is well prepared", "sound_sleep", "wide"),
            ("arjun_waking_up_without_alarm_ready", "Arjun waking up naturally at 6 AM feeling energized and eager to start revision games", "spontaneous_energy", "medium_shot"),
            ("arjun_turning_nervousness_into_excitement", "Arjun feeling heart race and whispering to himself: Ye dar nahi, ye winning energy hai", "reframing", "close_up"),
            ("arjun_looking_at_dream_iit_campus_photo", "Arjun looking at photo of IIT campus feeling for the first time that admission is within reach", "reachable_dream", "close_up"),
            ("arjun_holding_test_scorecard_proudly", "Arjun holding printed test analysis with 98.4 percentile showing it to webcam with grin", "unabashed_pride", "medium_shot"),
            ("arjun_thanking_mentor_priya_with_smile", "Arjun looking at Priya with heartfelt gratitude: Thank you for not letting me quit", "heartfelt_thanks", "medium_shot"),
            ("arjun_standing_tall_in_sunlight_window", "Arjun standing by study window bathed in bright golden morning sunshine full of hope", "hopeful_future", "wide"),
            ("arjun_cracking_knuckles_ready_for_mock", "Arjun cracking knuckles smiling with anticipation as 30-second test countdown begins", "game_on", "medium_shot"),
            ("arjun_knowing_hard_work_finally_paying_off", "Close up on Arjun eyes resolute and shining with the undeniable knowledge that he made it", "unshakeable_belief", "close_up"),
        ]
    },
    {
        "category": "celebration_and_playstore_cta",
        "character": "both",
        "fallback": "scenes/scene4_arjun_victory.jpg",
        "mouth": "ARJUN_DEFAULT_MOUTH",
        "setting": "arcade_room",
        "themes": [
            ("dual_high_five_celebration", "Arjun and Priya executing a crisp high-energy high five in front of glowing Aspirant Arcade logo", "celebratory", "medium_shot"),
            ("dual_standing_navy_yellow_jackets", "Arjun and Priya standing proudly side-by-side in matching navy blue jackets with yellow crests", "heroic", "medium_shot"),
            ("arjun_pointing_down_to_bio_cta", "Arjun pointing down toward bottom of screen with both hands: Link bio mein hai, abhi khelo!", "call_to_action", "medium_shot"),
            ("priya_holding_phone_playstore_cta", "Priya holding phone toward camera showing the Google Play Store Aspirant Arcade install page", "call_to_action", "close_up"),
            ("arjun_relaxed_sipping_chai_confident", "Arjun calmly sipping hot cutting chai with serene smile, exam stress completely replaced by confidence", "calm_confidence", "medium_shot"),
            ("dual_celebrating_confetti_fall", "Arjun and Priya laughing joyously as gold and cyan confetti falls all around their victory poses", "euphoric", "wide"),
            ("screen_app_download_playstore_mockup", "Polished 3D smartphone mockup showing Aspirant Arcade icon, 5-star rating, and INSTALL button", "cta_card", "screen_focus"),
            ("dual_thumbs_up_to_camera", "Arjun and Priya together giving simultaneous thumbs up to viewer: Milte hain top ranks mein!", "encouraging", "medium_shot"),
            ("arjun_shutting_laptop_mission_done", "Arjun gently closing laptop at 10 PM with zero guilt, daily goal 100 percent achieved", "accomplished", "medium_shot"),
            ("priya_waving_goodbye_cta", "Priya waving warmly to audience: Abhi app download karo aur apni exam prep ko level up karo!", "cheerful", "close_up"),
            ("arjun_holding_badge_trophy", "Arjun playfully holding a digital gold trophy on phone screen like an IPL winner", "champion", "close_up"),
            ("dual_pointing_together_at_logo", "Arjun on left and Priya on right both pointing upwards at glowing Aspirant Arcade emblem", "branding", "medium_shot"),
            ("screen_website_url_pulsing", "Futuristic glowing card displaying www.aspirant-arcade.xyz • Free Online Practice", "digital_cta", "screen_focus"),
            ("arjun_closing_eyes_peaceful", "Arjun taking a long peaceful breath with closed eyes feeling ready for exam morning", "inner_peace", "close_up"),
            ("priya_leaning_forward_final_hook", "Priya leaning forward: Link in bio abhi open karo aur apna score double karo!", "urgent_cta", "close_up"),
            ("arjun_walking_confidently_away", "Arjun slinging backpack over shoulder walking confidently toward the test center", "unstoppable", "wide"),
            ("screen_free_forever_banner", "Bold trust badge: 100 percent Free For All Aspirants • No Credit Card • Community First", "trust", "screen_focus"),
            ("dual_nodding_determined", "Arjun and Priya looking into distance with fierce quiet determination to conquer GATE 2026", "determined", "medium_shot"),
            ("arjun_giving_salute_respect", "Arjun snapping playful respectful salute to his mentor Priya: Thank you boss!", "respectful", "medium_shot"),
            ("priya_giving_peace_sign", "Priya flashing a cool two-finger peace sign with a wink: Study smart, not stressful", "cool", "close_up"),
            ("screen_google_play_badge_huge", "Huge official Google Play Store badge with Aspirant Arcade: Gamified GATE Prep tagline", "official_badge", "screen_focus"),
            ("arjun_high_five_to_camera", "Arjun giving a high five straight into phone camera lens to celebrate with viewer", "interactive", "close_up"),
            ("dual_outro_hero_pose", "Iconic final freeze-frame: Arjun and Priya in signature hero poses framed by glowing yellow arcade arches", "epic_finale", "wide"),
            ("arjun_priya_holding_qr_code_download", "Arjun and Priya holding large neon QR code card: Scan to download Aspirant Arcade on Android", "qr_cta", "medium_shot"),
            ("dual_arms_crossed_smug_toppers", "Arjun and Priya standing back-to-back arms crossed smirking: Preparation complete, exam conquered", "topper_duo", "medium_shot"),
            ("arjun_flashing_air_rank_number_one", "Arjun holding up index finger: Aiming for All India Rank 1, nothing less!", "aspirational", "close_up"),
            ("priya_pointing_to_ratings_stars", "Priya pointing to 5 glowing gold stars: Rated 4.9 by 10,000+ engineering aspirants nationwide", "social_proof", "close_up"),
            ("dual_holding_gate_admit_card_high", "Arjun and Priya holding up GATE admit cards high in air ready for the exam hall challenge", "battle_ready", "medium_shot"),
            ("screen_one_tap_install_google_play", "Close up on finger tapping green Install button on Google Play Store with instant progress bar", "instant_install", "screen_focus"),
            ("arjun_priya_clinking_chai_glasses", "Arjun and Priya clinking two glasses of hot cutting chai together: To consistency and high scores!", "toast_celebration", "medium_shot"),
            ("arjun_wearing_aspirant_arcade_cap", "Arjun turning around wearing navy and yellow Aspirant Arcade cap giving a sly wink", "merch_style", "close_up"),
            ("priya_holding_microphone_reporting", "Priya speaking into microphone like sports commentator: Breaking news: Arjun defeated exam anxiety!", "anchor_fun", "medium_shot"),
            ("dual_jumping_in_air_victory", "Arjun and Priya mid-air jumping freeze-frame celebration outside college gate", "freeze_frame", "wide"),
            ("screen_compatible_android_ios_web", "Clean device compatibility icons showing smartphone, tablet, laptop with 100% cloud sync", "cross_platform", "screen_focus"),
            ("arjun_pointing_at_website_link_bio", "Arjun pointing directly below camera frame: Link is right in bio, go play right now!", "direct_cta", "close_up"),
            ("priya_holding_smart_tablet_play_now", "Priya holding tablet showing Start Playing button pulsing with golden invitation aura", "inviting", "close_up"),
            ("dual_saluting_all_gate_aspirants", "Arjun and Priya giving crisp synchronous salute to all hardworking engineering aspirants across India", "national_tribute", "medium_shot"),
            ("screen_zero_subscription_forever", "Big bold badge: ZERO SUBSCRIPTION • NO HIDDEN FEES • 100 PERCENT FREE FOR ASPIRANTS", "free_pledge", "screen_focus"),
            ("arjun_giving_peace_sign_waving", "Arjun flashing peace sign and waving goodbye with broad friendly smile", "friendly_outro", "close_up"),
            ("priya_giving_two_hands_heart_gesture", "Priya forming cute heart shape with two hands to the audience: All the best champions!", "warm_love", "close_up"),
            ("dual_standing_with_golden_trophy", "Arjun and Priya standing on winner's podium with giant golden Aspirant Arcade trophy", "podium_finish", "wide"),
            ("screen_scan_to_play_instant_qr", "High-contrast QR code centered on screen: Scan to Play Instantly • No App Install Needed", "instant_web_qr", "screen_focus"),
            ("arjun_zipping_backpack_ready_for_topper", "Arjun zipping up backpack with confident swagger: Time to go write history", "swagger", "medium_shot"),
            ("priya_offering_final_mentor_smile", "Priya giving one last warm reassuring smile: Believe in yourself, you've got this", "mentor_blessing", "close_up"),
            ("dual_whispering_secret_code_together", "Arjun and Priya whispering in unison: Stop scrolling, start scoring on Aspirant Arcade", "catchphrase", "medium_shot"),
            ("screen_play_store_search_bar_typing", "Screen showing Google Play Store search bar typing Aspirant Arcade and hitting enter", "search_guide", "screen_focus"),
            ("arjun_priya_side_by_side_running_ahead", "Arjun and Priya walking purposefully into golden sunrise towards bright engineering careers", "future_ahead", "wide"),
            ("dual_arms_around_shoulders_team", "Arjun and Priya with arms around each other's shoulders smiling warmly like true study partners", "unbreakable_bond", "medium_shot"),
            ("screen_closing_brand_logo_sound_chime", "Iconic Aspirant Arcade logo emblem centered on AMOLED black background with golden shimmer", "brand_outro", "screen_focus"),
            ("dual_final_bow_thank_you_viewers", "Arjun and Priya giving a polite joyful bow to camera thanking viewers and wishing high ranks", "final_bow", "medium_shot"),
        ]
    }
]

# Generate the complete TypeScript file
lines = []
lines.append("/**")
lines.append(" * Aspirant Arcade 500-Shot Master Scene Catalog.")
lines.append(" *")
lines.append(" * Comprehensive library of 500 reusable character poses, emotional states,")
lines.append(" * product gameplay views, hostel moments, and celebrations for Arjun and Priya.")
lines.append(" *")
lines.append(" * Features On-Demand Generation: If a shot's image does not yet exist in public/scenes/catalog/,")
lines.append(" * the sceneImageGenerator automatically generates and caches it on the fly.")
lines.append(" */")
lines.append("")
lines.append("export interface MouthAnchor {")
lines.append("  centerX: string;")
lines.append("  centerY: string;")
lines.append("  baseWidth: number;")
lines.append("  maxHeight: number;")
lines.append("  rotationDeg: number;")
lines.append("  lipColor: string;")
lines.append("}")
lines.append("")
lines.append("export interface ShotDefinition {")
lines.append("  id: string;")
lines.append("  category: string;")
lines.append("  character: 'arjun' | 'priya' | 'both' | 'screen';")
lines.append("  mood: string;")
lines.append("  setting: string;")
lines.append("  camera: 'close_up' | 'medium_shot' | 'over_the_shoulder' | 'wide' | 'screen_focus';")
lines.append("  description: string;")
lines.append("  tags: string[];")
lines.append("  assetPath: string;")
lines.append("  fallbackAsset: string;")
lines.append("  mouth?: MouthAnchor;")
lines.append("}")
lines.append("")
lines.append("export const ARJUN_DEFAULT_MOUTH: MouthAnchor = {")
lines.append("  centerX: '59.9%',")
lines.append("  centerY: '40.3%',")
lines.append("  baseWidth: 26,")
lines.append("  maxHeight: 16,")
lines.append("  rotationDeg: -5,")
lines.append("  lipColor: 'rgba(100, 45, 30, 0.95)',")
lines.append("};")
lines.append("")
lines.append("export const PRIYA_DEFAULT_MOUTH: MouthAnchor = {")
lines.append("  centerX: '48.5%',")
lines.append("  centerY: '36.8%',")
lines.append("  baseWidth: 24,")
lines.append("  maxHeight: 15,")
lines.append("  rotationDeg: 1,")
lines.append("  lipColor: 'rgba(110, 40, 30, 0.95)',")
lines.append("};")
lines.append("")
lines.append("export const SCENES_CATALOG: Record<string, ShotDefinition> = {")

total_count = 0
for cat in categories_data:
    cat_name = cat["category"]
    char = cat["character"]
    fallback = cat["fallback"]
    mouth = cat["mouth"]
    setting = cat["setting"]
    
    lines.append(f"  // ═══ CATEGORY: {cat_name.upper()} ({len(cat['themes'])} SHOTS) ═══")
    
    for shot_id, desc, mood, camera in cat["themes"]:
        shot_id = shot_id.replace('-', '_')
        total_count += 1
        tags = [shot_id.replace('_', ' '), cat_name, mood, char]
        tags_json = json.dumps(tags[:5])
        
        mouth_line = f"    mouth: {mouth}," if mouth != "None" else ""
        
        lines.append(f"  {shot_id}: {{")
        lines.append(f"    id: '{shot_id}',")
        lines.append(f"    category: '{cat_name}',")
        lines.append(f"    character: '{char}',")
        lines.append(f"    mood: '{mood}',")
        lines.append(f"    setting: '{setting}',")
        lines.append(f"    camera: '{camera}',")
        lines.append(f"    description: {json.dumps(desc + '.')},")
        lines.append(f"    tags: {tags_json},")
        lines.append(f"    assetPath: 'scenes/catalog/{shot_id}.jpg',")
        lines.append(f"    fallbackAsset: '{fallback}',")
        if mouth_line:
            lines.append(mouth_line)
        lines.append("  },")

lines.append("};")
lines.append("")
lines.append("/** Total defined shots in the master catalog */")
lines.append("export const TOTAL_CATALOG_SHOTS = Object.keys(SCENES_CATALOG).length;")
lines.append("")
lines.append("/** Helper to retrieve a shot with safe fallback */")
lines.append("export function getShotDefinition(sceneId: string): ShotDefinition {")
lines.append("  if (SCENES_CATALOG[sceneId]) {")
lines.append("    return SCENES_CATALOG[sceneId];")
lines.append("  }")
lines.append("  return SCENES_CATALOG['arjun_head_in_hands_books'];")
lines.append("}")
lines.append("")
lines.append("/** Summarized catalog prompt for Gemini Film Director */")
lines.append("export function buildCatalogPromptSummary(): string {")
lines.append("  const categories: Record<string, string[]> = {};")
lines.append("  for (const shot of Object.values(SCENES_CATALOG)) {")
lines.append("    if (!categories[shot.category]) categories[shot.category] = [];")
lines.append("    if (categories[shot.category].length < 12) {")
lines.append("      categories[shot.category].push(`- \"${shot.id}\" (${shot.character}, ${shot.mood}): ${shot.description}`);")
lines.append("    }")
lines.append("  }")
lines.append("  let summary = '=== ASPIRANT ARCADE 500-SHOT MASTER CATALOG ===\\n';")
lines.append("  for (const [cat, shots] of Object.entries(categories)) {")
lines.append("    summary += `\\n[CATEGORY: ${cat.toUpperCase()}]\\n` + shots.join('\\n') + '\\n';")
lines.append("  }")
lines.append("  return summary;")
lines.append("}")

with open('src/catalog/scenesCatalog.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print(f"Generated 500-Shot Master Catalog with {total_count} shots successfully!")
