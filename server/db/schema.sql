CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS players (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    username    VARCHAR(50)  UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    level       INTEGER      NOT NULL DEFAULT 1,
    exp         INTEGER      NOT NULL DEFAULT 0,
    hp          INTEGER      NOT NULL DEFAULT 100,
    max_hp      INTEGER      NOT NULL DEFAULT 100,
    map_x       INTEGER      NOT NULL DEFAULT 400,
    map_y       INTEGER      NOT NULL DEFAULT 300,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
    id              SERIAL       PRIMARY KEY,
    zone            VARCHAR(50)  NOT NULL,
    difficulty      VARCHAR(20)  NOT NULL
                    CHECK (difficulty IN ('basic', 'intermediate')),
    subject         VARCHAR(30)  NOT NULL,
    question_text   TEXT         NOT NULL,
    options         JSONB        NOT NULL,
    correct_idx     INTEGER      NOT NULL
                    CHECK (correct_idx BETWEEN 0 AND 3),
    explanation     TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_zone_diff
    ON questions (zone, difficulty);

CREATE TABLE IF NOT EXISTS player_badges (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id   UUID         NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    badge_name  VARCHAR(100) NOT NULL,
    zone        VARCHAR(50)  NOT NULL,
    earned_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (player_id, badge_name)
);

INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('physics_town','basic','Physics',
 'What is the SI unit of force?',
 '["Newton","Joule","Watt","Pascal"]',0,
 'Force = mass × acceleration. The SI unit is Newton (N).'),

('physics_town','basic','Physics',
 'Which law states that every action has an equal and opposite reaction?',
 '["Newton''s First Law","Newton''s Second Law","Newton''s Third Law","Law of Gravitation"]',2,
 'Newton''s Third Law of Motion.'),

('physics_town','basic','Physics',
 'What is the SI unit of energy?',
 '["Watt","Newton","Joule","Pascal"]',2,
 'Energy is measured in Joules (J = kg·m²/s²).'),

('physics_town','basic','Physics',
 'Which quantity has both magnitude and direction?',
 '["Speed","Distance","Mass","Velocity"]',3,
 'Velocity is a vector quantity — it has both magnitude and direction.'),

('physics_town','basic','Physics',
 'A car travels 100 km in 2 hours. What is its average speed?',
 '["25 km/h","50 km/h","100 km/h","200 km/h"]',1,
 'Speed = Distance / Time = 100 / 2 = 50 km/h.'),

('physics_town','basic','Physics',
 'What is the value of acceleration due to gravity (g) near Earth''s surface?',
 '["8.9 m/s²","9.8 m/s²","10.8 m/s²","11.2 m/s²"]',1,
 'Standard value of g ≈ 9.8 m/s² (often approximated as 10 m/s²).'),

('physics_town','basic','Physics',
 'Which of these is a scalar quantity?',
 '["Force","Acceleration","Temperature","Displacement"]',2,
 'Temperature has only magnitude, no direction — it is a scalar.'),

('physics_town','basic','Physics',
 'What is the unit of electric current?',
 '["Volt","Ohm","Ampere","Watt"]',2,
 'Electric current is measured in Amperes (A).'),

('physics_town','basic','Physics',
 'According to Newton''s First Law, a body at rest remains at rest unless acted upon by a:',
 '["Balanced force","Net zero force","Non-zero external force","Gravitational force only"]',2,
 'Newton''s First Law — the law of inertia. An unbalanced (non-zero net) external force is required to change the state of rest.'),

('physics_town','basic','Physics',
 'Ohm''s Law states that V = ?',
 '["I / R","I + R","I × R","I² × R"]',2,
 'Ohm''s Law: Voltage (V) = Current (I) × Resistance (R).')

ON CONFLICT DO NOTHING;

INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('physics_town','intermediate','Physics',
 'A body moves in a circle of radius r with speed v. Its centripetal acceleration is:',
 '["v/r","v²/r","r/v²","vr"]',1,
 'Centripetal acceleration a = v²/r.'),

('physics_town','intermediate','Physics',
 'The work done by a force F over displacement d at angle θ is:',
 '["F × d","F × d × sin θ","F × d × cos θ","F / d"]',2,
 'W = F·d·cos θ. Work is the dot product of force and displacement vectors.'),

('physics_town','intermediate','Physics',
 'A projectile is launched at 45°. Which angle gives maximum range on flat ground?',
 '["30°","45°","60°","90°"]',1,
 'Range is maximized at 45° because sin(2θ) is maximum at θ = 45°.'),

('physics_town','intermediate','Physics',
 'Two objects of mass 2 kg and 4 kg are connected by a string over a frictionless pulley. The acceleration of the system is: (g = 10 m/s²)',
 '["10/3 m/s²","5/3 m/s²","20/6 m/s²","3.33 m/s²"]',0,
 'a = (m2 - m1)g / (m1 + m2) = (4-2)×10 / (2+4) = 20/6 ≈ 3.33 m/s². All listed options equal the same value; correct_idx=0.'),

('physics_town','intermediate','Physics',
 'A spring of spring constant k is stretched by x. The potential energy stored is:',
 '["kx","½kx","kx²","½kx²"]',3,
 'Elastic PE = ½kx².'),

('physics_town','intermediate','Physics',
 'What is the escape velocity from Earth''s surface? (g=9.8 m/s², R=6.4×10⁶ m)',
 '["7.9 km/s","11.2 km/s","15.0 km/s","3.2 km/s"]',1,
 'Escape velocity v = √(2gR) ≈ 11.2 km/s.'),

('physics_town','intermediate','Physics',
 'A wave has frequency 500 Hz and wavelength 0.68 m. Its speed is:',
 '["340 m/s","500 m/s","0.68 m/s","735 m/s"]',0,
 'v = fλ = 500 × 0.68 = 340 m/s (speed of sound in air).'),

('physics_town','intermediate','Physics',
 'The moment of inertia of a solid sphere about its diameter is:',
 '["½mr²","⅔mr²","⅖mr²","mr²"]',2,
 'I = (2/5)mr² for a solid sphere about a diameter.'),

('physics_town','intermediate','Physics',
 'Electric field due to a point charge Q at distance r is:',
 '["kQ/r","kQ/r²","kQ²/r","kQ/r³"]',1,
 'E = kQ/r² by Coulomb''s law (k = 1/4πε₀).'),

('physics_town','intermediate','Physics',
 'The phenomenon of light bending around corners is called:',
 '["Reflection","Refraction","Diffraction","Polarization"]',2,
 'Diffraction is the bending of waves around obstacles or through slits.')

ON CONFLICT DO NOTHING;

INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('math_town','basic','Mathematics',
 'What is the derivative of sin(x)?',
 '["cos(x)","-cos(x)","sin(x)","-sin(x)"]',0,
 'd/dx [sin(x)] = cos(x).'),

('math_town','basic','Mathematics',
 'What is the integral of cos(x)?',
 '["-sin(x)","sin(x)","tan(x)","cos(x)"]',1,
 '∫cos(x)dx = sin(x) + C.'),

('math_town','basic','Mathematics',
 'What is log₁₀(100)?',
 '["1","2","10","100"]',1,
 'log₁₀(100) = log₁₀(10²) = 2.'),

('math_town','basic','Mathematics',
 'The sum of angles in a triangle is:',
 '["90°","180°","270°","360°"]',1,
 'Sum of interior angles of any triangle = 180°.'),

('math_town','basic','Mathematics',
 'What is the value of sin(30°)?',
 '["√3/2","1/2","1","√2/2"]',1,
 'sin(30°) = 1/2.'),

('math_town','basic','Mathematics',
 'If f(x) = 3x² + 2x + 1, what is f''(x)?',
 '["3x + 2","6x + 2","6x² + 2","3x² + 2"]',1,
 'f''(x) = 6x + 2 by the power rule.'),

('math_town','basic','Mathematics',
 'What is the slope of the line y = 4x - 7?',
 '["-7","4","7","-4"]',1,
 'In y = mx + c, m is the slope. Here m = 4.'),

('math_town','basic','Mathematics',
 'The number of ways to arrange 4 distinct books on a shelf is:',
 '["4","16","24","256"]',2,
 '4! = 4 × 3 × 2 × 1 = 24.'),

('math_town','basic','Mathematics',
 'What is the area of a circle with radius 7?',
 '["22π","44π","49π","14π"]',2,
 'Area = πr² = π × 49 = 49π.'),

('math_town','basic','Mathematics',
 'Solve: 2x + 5 = 13. What is x?',
 '["3","4","5","6"]',1,
 '2x = 8 → x = 4.')

ON CONFLICT DO NOTHING;

INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('math_town','intermediate','Mathematics',
 'What is ∫₀¹ x² dx?',
 '["1/2","1/3","1/4","2/3"]',1,
 '∫x² dx = x³/3. Evaluated 0 to 1 = 1/3 - 0 = 1/3.'),

('math_town','intermediate','Mathematics',
 'The general solution to dy/dx = y is:',
 '["y = x + C","y = Ce^x","y = Cx","y = ln(x) + C"]',1,
 'Separable ODE: dy/y = dx → ln|y| = x + C → y = Ce^x.'),

('math_town','intermediate','Mathematics',
 'What is the determinant of the matrix [[2,3],[1,4]]?',
 '["5","8","11","14"]',0,
 'det = (2×4) - (3×1) = 8 - 3 = 5.'),

('math_town','intermediate','Mathematics',
 'The sum of an infinite GP with first term a and ratio r (|r|<1) is:',
 '["a/(1+r)","a/(1-r)","a×r","a(1-r)"]',1,
 'Sum∞ = a / (1 - r) for |r| < 1.'),

('math_town','intermediate','Mathematics',
 'If A and B are mutually exclusive, P(A∪B) = ?',
 '["P(A)×P(B)","P(A)+P(B)-P(A∩B)","P(A)+P(B)","P(A|B)"]',2,
 'Mutually exclusive means P(A∩B) = 0, so P(A∪B) = P(A) + P(B).'),

('math_town','intermediate','Mathematics',
 'The roots of x² - 5x + 6 = 0 are:',
 '["2 and 4","1 and 6","2 and 3","3 and 4"]',2,
 'Factors: (x-2)(x-3) = 0 → x = 2 or x = 3.'),

('math_town','intermediate','Mathematics',
 'What is the value of lim(x→0) [sin(x)/x]?',
 '["0","∞","1","undefined"]',2,
 'This is a standard limit: lim(x→0) sin(x)/x = 1.'),

('math_town','intermediate','Mathematics',
 'What is the rank of the matrix [[1,2,3],[2,4,6],[3,6,9]]?',
 '["0","1","2","3"]',1,
 'Rows 2 and 3 are multiples of row 1 — only 1 linearly independent row. Rank = 1.'),

('math_town','intermediate','Mathematics',
 'The angle between vectors A=(1,0) and B=(0,1) is:',
 '["0°","45°","90°","180°"]',2,
 'cos θ = A·B / (|A||B|) = 0. So θ = 90°.'),

('math_town','intermediate','Mathematics',
 'What is the maximum value of f(x) = -x² + 4x - 1?',
 '["1","3","4","5"]',1,
 'f''(x) = -2x + 4 = 0 → x=2. f(2) = -4 + 8 - 1 = 3.')

ON CONFLICT DO NOTHING;

INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('chem_town','basic','Chemistry',
 'What is the atomic number of Carbon?',
 '["4","6","8","12"]',1,
 'Carbon (C) has 6 protons → atomic number = 6.'),

('chem_town','basic','Chemistry',
 'Which gas is produced when a metal reacts with dilute acid?',
 '["Oxygen","Carbon dioxide","Hydrogen","Nitrogen"]',2,
 'Metal + Dilute acid → Salt + Hydrogen gas. E.g. Zn + H₂SO₄ → ZnSO₄ + H₂↑'),

('chem_town','basic','Chemistry',
 'What is the chemical formula of water?',
 '["HO","H₂O","H₂O₂","OH"]',1,
 'Water is H₂O — two hydrogen atoms bonded to one oxygen.'),

('chem_town','basic','Chemistry',
 'Which element has the symbol "Na"?',
 '["Nitrogen","Neon","Sodium","Nickel"]',2,
 'Na comes from Latin "Natrium" — the chemical symbol for Sodium.'),

('chem_town','basic','Chemistry',
 'The pH of a neutral solution at 25°C is:',
 '["0","7","14","1"]',1,
 'pH 7 = neutral. Below 7 = acidic. Above 7 = basic.'),

('chem_town','basic','Chemistry',
 'Which type of bond forms when electrons are shared between atoms?',
 '["Ionic","Covalent","Metallic","Hydrogen"]',1,
 'Covalent bonds are formed by sharing of electron pairs between atoms.'),

('chem_town','basic','Chemistry',
 'What is the valency of Oxygen?',
 '["1","2","3","4"]',1,
 'Oxygen has 6 valence electrons and needs 2 more to complete its octet. Valency = 2.'),

('chem_town','basic','Chemistry',
 'Which of the following is a noble gas?',
 '["Hydrogen","Nitrogen","Argon","Chlorine"]',2,
 'Argon (Ar) belongs to Group 18 — the noble gases. It has a full outer electron shell.'),

('chem_town','basic','Chemistry',
 'What is the chemical name of NaCl?',
 '["Sodium carbonate","Sodium chloride","Sodium hydroxide","Sodium oxide"]',1,
 'NaCl = Sodium chloride (common table salt).'),

('chem_town','basic','Chemistry',
 'Avogadro''s number is approximately:',
 '["6.022 × 10²³","3.14 × 10²³","9.8 × 10²³","1.6 × 10¹⁹"]',0,
 'Avogadro''s number = 6.022 × 10²³ mol⁻¹. It represents the number of entities in one mole.')

ON CONFLICT DO NOTHING;

INSERT INTO questions (zone, difficulty, subject, question_text, options, correct_idx, explanation) VALUES
('chem_town','intermediate','Chemistry',
 'According to VSEPR theory, the shape of a water molecule (H₂O) is:',
 '["Linear","Trigonal planar","Bent / V-shaped","Tetrahedral"]',2,
 'H₂O has 2 bonding pairs + 2 lone pairs on O → bent/V-shaped geometry.'),

('chem_town','intermediate','Chemistry',
 'For the reaction N₂ + 3H₂ → 2NH₃, what is the equilibrium expression Kc?',
 '["[NH₃]²/([N₂][H₂]³)","[N₂][H₂]³/[NH₃]²","[NH₃]/([N₂][H₂])","[NH₃]²/[H₂]³"]',0,
 'Kc = [products]^coeff / [reactants]^coeff = [NH₃]² / ([N₂][H₂]³).'),

('chem_town','intermediate','Chemistry',
 'Which quantum number defines the shape of an orbital?',
 '["Principal (n)","Azimuthal (l)","Magnetic (ml)","Spin (ms)"]',1,
 'The azimuthal quantum number l defines the shape: l=0(s), l=1(p), l=2(d), l=3(f).'),

('chem_town','intermediate','Chemistry',
 'The hybridization of carbon in ethene (C₂H₄) is:',
 '["sp","sp²","sp³","sp³d"]',1,
 'Each carbon in ethene forms 3 σ bonds + 1 π bond → sp² hybridization.'),

('chem_town','intermediate','Chemistry',
 'Entropy (S) of a system always increases in a:',
 '["Reversible process","Irreversible process","Isothermal process","Adiabatic process"]',1,
 'The 2nd Law of Thermodynamics: entropy increases in irreversible (spontaneous) processes.'),

('chem_town','intermediate','Chemistry',
 'Which of the following is an example of a nucleophile?',
 '["H⁺","BF₃","AlCl₃","OH⁻"]',3,
 'A nucleophile donates electrons. OH⁻ is electron-rich → nucleophile. H⁺, BF₃, AlCl₃ are electrophiles.'),

('chem_town','intermediate','Chemistry',
 'The rate law for a reaction that is first order in [A] and second order in [B] is:',
 '["rate = k[A][B]","rate = k[A]²[B]","rate = k[A][B]²","rate = k[A]²[B]²"]',2,
 'Rate = k[A]¹[B]² — exponents equal the respective orders.'),

('chem_town','intermediate','Chemistry',
 'In a galvanic cell, oxidation occurs at the:',
 '["Cathode","Anode","Salt bridge","Electrolyte"]',1,
 'OIL RIG: Oxidation Is Loss → at the Anode. Reduction → at the Cathode.'),

('chem_town','intermediate','Chemistry',
 'The van''t Hoff factor (i) for NaCl completely dissociated in water is:',
 '["1","2","3","0.5"]',1,
 'NaCl → Na⁺ + Cl⁻ → 2 particles per formula unit → i = 2.'),

('chem_town','intermediate','Chemistry',
 'Which law states that at constant temperature, pressure and volume of a gas are inversely proportional?',
 '["Charles''s Law","Avogadro''s Law","Boyle''s Law","Dalton''s Law"]',2,
 'Boyle''s Law: P ∝ 1/V at constant T. PV = constant.')

ON CONFLICT DO NOTHING;
