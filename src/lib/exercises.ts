import { ExerciseDefinition } from '../types';

export const EXERCISE_DATABASE: ExerciseDefinition[] = [
  // CHEST
  {
    id: 'bench-press-barbell',
    name: 'Barbell Bench Press',
    category: 'Chest',
    equipment: 'Barbell',
    defaultRestSeconds: 120,
    difficulty: 'Intermediate',
    targetMuscles: ['Pectoralis Major (Mid & Lower)', 'Anterior Deltoids'],
    secondaryMuscles: ['Triceps Brachii', 'Serratus Anterior'],
    description: 'The premier compound upper-body pushing exercise for maximal horizontal pushing power and pectoral hypertrophy.',
    setupInstructions: [
      'Lie flat on the bench with eyes directly underneath the racked barbell.',
      'Plant feet flat and firm on the ground for leg drive. Retract and depress your scapulae into the bench.',
      'Grip the bar slightly wider than shoulder-width with thumbs wrapped securely.'
    ],
    executionInstructions: [
      'Unrack the bar and stabilize it directly over your upper chest with elbows extended.',
      'Inhale deep into your diaphragm and lower the bar in a controlled diagonal arc to the lower sternum.',
      'Tuck elbows roughly 45–60 degrees relative to your torso.',
      'Lightly touch your chest without bouncing, then drive explosively upward back over shoulder joints.'
    ],
    formCues: [
      'Pack shoulder blades tight like tucking them into your back pockets.',
      'Keep wrists stacked straight over elbows throughout the entire press.',
      'Drive aggressively through the heels to engage full-body leg drive.'
    ],
    commonMistakes: [
      'Flaring elbows out at 90 degrees (strains rotator cuff tendons).',
      'Bouncing the bar violently off the sternum.',
      'Lifting glutes off the bench during heavy attempts.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/rT7DgCr-3pg?rel=0&modestbranding=1',
    videoSourceTitle: 'Barbell Bench Press Movement Guide',
    animationGifUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Reverse-triceps-bench-press-2.gif',
    loopDurationSeconds: 4,
    workoutGuideSlug: 'bench-press',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/EIeI8Vf.gif'
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    category: 'Chest',
    equipment: 'Dumbbell',
    defaultRestSeconds: 90,
    difficulty: 'Intermediate',
    targetMuscles: ['Clavicular Pectoralis (Upper Chest)', 'Anterior Deltoids'],
    secondaryMuscles: ['Triceps Brachii'],
    description: 'Targeted incline pressing focusing heavily on the clavicular head of the pectorals with unilateral stabilization.',
    setupInstructions: [
      'Set the adjustable bench angle between 30 and 45 degrees.',
      'Sit down with dumbbells resting on your thighs, then kick dumbbells up one knee at a time into position.',
      'Retract shoulder blades and establish a stable foot base.'
    ],
    executionInstructions: [
      'Press dumbbells up until arms are extended above your upper chest.',
      'Lower the weights under control with elbows slightly tucked at roughly 45 degrees.',
      'Achieve a deep muscular stretch at the bottom before pressing back up in a subtle inward arc.'
    ],
    formCues: [
      'Keep wrists neutral and directly over your elbows.',
      'Control the eccentric descent for a full 2 to 3 seconds.',
      'Avoid clinking the dumbbells together at the top to maintain continuous muscle tension.'
    ],
    commonMistakes: [
      'Setting bench angle too high (>45 degrees), which shifts focus entirely to front deltoids.',
      'Arching lower back excessively to flatten the pressing angle.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/8iPEnn-ltC8?rel=0&modestbranding=1',
    videoSourceTitle: 'Incline Dumbbell Press Form Guide',
    workoutGuideSlug: 'incline-dumbbell-press',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/B3Rxp6L.gif'
  },
  {
    id: 'dips-chest',
    name: 'Chest Dips',
    category: 'Chest',
    equipment: 'Bodyweight',
    defaultRestSeconds: 90,
    difficulty: 'Intermediate',
    targetMuscles: ['Lower Pectoralis Major', 'Anterior Deltoids'],
    secondaryMuscles: ['Triceps Brachii'],
    description: 'High-intensity compound bodyweight movement delivering unmatched lower chest stimulus and shoulder stability.',
    setupInstructions: [
      'Grip the parallel dip bars with arms fully locked and palms facing inward.',
      'Lean your torso forward at roughly a 30-degree angle and bend knees slightly.'
    ],
    executionInstructions: [
      'Lower your body by bending at the elbows, maintaining forward torso lean.',
      'Descend until your upper arms are parallel to the floor or shoulder reaches elbow level.',
      'Press through your palms to return to full lockout while squeezing chest at the top.'
    ],
    formCues: [
      'Maintain continuous forward lean to keep stress on pectorals rather than upright tricep isolation.',
      'Keep elbows from flaring excessively wide.'
    ],
    commonMistakes: [
      'Staying upright which eliminates chest activation.',
      'Dropping too low past personal shoulder mobility thresholds.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/2z8JmcrW-As?rel=0&modestbranding=1',
    videoSourceTitle: 'Chest Dips Technique',
    workoutGuideSlug: 'chest-dip',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/9WTm7dq.gif'
  },
  {
    id: 'cable-crossover',
    name: 'Cable Chest Flyes',
    category: 'Chest',
    equipment: 'Cable',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Sternal Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoids', 'Biceps Short Head'],
    description: 'Constant-tension isolation exercise emphasizing horizontal adduction and peak pectoral contraction.',
    setupInstructions: [
      'Set dual cable pulleys to chest or shoulder height with single D-handles attached.',
      'Grasp both handles, take a staggered step forward, and lean slightly from the hips.'
    ],
    executionInstructions: [
      'With a slight bend in your elbows, sweep your hands forward and together in a wide hugging motion.',
      'Squeeze chest forcefully at peak contraction for 1 second.',
      'Return slowly under cable tension until you feel a comfortable stretch across the chest.'
    ],
    formCues: [
      'Imagine hugging a large barrel to keep elbow angle fixed throughout.',
      'Lead with your elbows rather than wrists.'
    ],
    commonMistakes: [
      'Turning the movement into a pressing motion by bending elbows excessively.',
      'Using swinging body momentum to initiate the fly.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/taI4XduLpBe?rel=0&modestbranding=1',
    videoSourceTitle: 'Cable Flyes Movement Cues',
    workoutGuideSlug: 'cable-fly',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/0CXGHya.gif'
  },
  {
    id: 'push-ups',
    name: 'Push-Ups',
    category: 'Chest',
    equipment: 'Bodyweight',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Pectoralis Major', 'Anterior Deltoids'],
    secondaryMuscles: ['Triceps Brachii', 'Core Abdominals'],
    description: 'The foundational horizontal pushing exercise for relative strength, shoulder health, and core stability.',
    setupInstructions: [
      'Place hands on the floor slightly wider than shoulder-width.',
      'Step back into a rigid plank with feet together and glutes squeezed.'
    ],
    executionInstructions: [
      'Lower your entire body in one solid line until your chest is 1 inch off the floor.',
      'Keep elbows angled roughly 45 degrees back towards your ribs.',
      'Push the ground away forcefully back to full plank lockout.'
    ],
    formCues: [
      'Maintain an unbroken straight line from head to heels.',
      'Grip the floor with your fingers to generate spiral shoulder torque.'
    ],
    commonMistakes: [
      'Sagging the lower back and hips.',
      'Flaring elbows straight out to the sides into a "T" position.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/IODxDxX7oi4?rel=0&modestbranding=1',
    videoSourceTitle: 'Proper Push-Up Form',
    animationGifUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Man_Doing_Push_Ups_GIF_Animation_Loop.gif',
    loopDurationSeconds: 3,
    workoutGuideSlug: 'push-up',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/I4hDWkc.gif'
  },
  {
    id: 'dumbbell-flat-press',
    name: 'Flat Dumbbell Press',
    category: 'Chest',
    equipment: 'Dumbbell',
    defaultRestSeconds: 90,
    difficulty: 'Intermediate',
    targetMuscles: ['Pectoralis Major', 'Anterior Deltoids'],
    secondaryMuscles: ['Triceps Brachii'],
    description: 'Free-weight dumbbell press offering extended range of motion and correcting muscular imbalances.',
    setupInstructions: [
      'Sit on flat bench, kick dumbbells up from knees, and lie flat with feet pressed into floor.',
      'Set dumbbells above chest with elbows at 45–60 degrees.'
    ],
    executionInstructions: [
      'Lower weights steadily until dumbbells reach mid-chest level.',
      'Press up smoothly and converge gently toward center without colliding.'
    ],
    formCues: [
      'Keep forearms strictly vertical throughout the entire range of motion.',
      'Retract scapulae firmly into the bench.'
    ],
    commonMistakes: [
      'Dropping dumbbells too quickly on eccentric descent.',
      'Letting wrists hyperextend backwards.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/VmB1G1K7v94?rel=0&modestbranding=1',
    videoSourceTitle: 'Flat Dumbbell Press Execution',
    workoutGuideSlug: 'dumbbell-bench-press',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/SpYC0Kp.gif'
  },
  {
    id: 'pec-deck-flyes',
    name: 'Pec Deck Machine',
    category: 'Chest',
    equipment: 'Machine',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Pectoralis Major (Sternal Head)'],
    secondaryMuscles: ['Anterior Deltoid'],
    description: 'Guided chest fly machine allowing maximum isolation without balance demands.',
    setupInstructions: [
      'Adjust seat height so handles are level with mid-chest.',
      'Press back and head flush against pad with feet planted firmly.'
    ],
    executionInstructions: [
      'Grip handles with slight elbow bend and bring arms together in front of chest.',
      'Hold the peak contraction for a solid count before opening back smoothly.'
    ],
    formCues: [
      'Focus on driving the inner biceps towards each other.',
      'Keep shoulder blades pinned to the back pad.'
    ],
    commonMistakes: [
      'Letting shoulders round forward off pad at peak squeeze.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/O-b0F0v_27Y?rel=0&modestbranding=1',
    videoSourceTitle: 'Pec Deck Machine Guide',
    workoutGuideSlug: 'pec-deck',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/v3xmPAR.gif'
  },

  // BACK
  {
    id: 'deadlift-conventional',
    name: 'Conventional Deadlift',
    category: 'Back',
    equipment: 'Barbell',
    defaultRestSeconds: 180,
    difficulty: 'Advanced',
    targetMuscles: ['Erector Spinae', 'Gluteus Maximus', 'Hamstrings', 'Latissimus Dorsi'],
    secondaryMuscles: ['Trapezius', 'Forearms / Grip', 'Core'],
    description: 'The supreme test of posterior chain raw power and total body structural integrity.',
    setupInstructions: [
      'Stand with feet hip-width apart, barbell cutting directly over mid-foot (1 inch from shins).',
      'Hinge at hips to grip bar just outside knees without moving the bar.',
      'Pull shins forward to touch bar, pull chest tall, and wedge hips into starting position.'
    ],
    executionInstructions: [
      'Take a deep belly breath, expand your core 360°, and pull the slack out of the bar with a sharp "click".',
      'Push the floor away through your mid-foot like a leg press until the bar passes the knees.',
      'Drive hips forward to stand erect; lock out knees and hips with neutral spine.'
    ],
    formCues: [
      'Protect your spine by keeping lats packed tight (imagine squeezing oranges in armpits).',
      'Keep the bar in continuous dragging contact with shins and thighs.',
      'Push the earth away rather than pulling the bar up with arms.'
    ],
    commonMistakes: [
      'Rounding the lumbar spine under heavy loads.',
      'Hips shooting up first before the barbell breaks the floor.',
      'Over-extending and leaning back backward at lockout.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/op9kVnSso6Q?rel=0&modestbranding=1',
    videoSourceTitle: 'Deadlift Mastery & Form',
    animationGifUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Man_Lifting_Barbell_Deadlift_GIF_Animation_Loop.gif',
    loopDurationSeconds: 4,
    workoutGuideSlug: 'deadlift',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/ila4NZS.gif'
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    category: 'Back',
    equipment: 'Bodyweight',
    defaultRestSeconds: 120,
    difficulty: 'Intermediate',
    targetMuscles: ['Latissimus Dorsi', 'Teres Major'],
    secondaryMuscles: ['Biceps Brachii', 'Brachialis', 'Lower Traps'],
    description: 'Gold standard vertical pulling exercise creating exceptional back width and upper body pulling strength.',
    setupInstructions: [
      'Grip the pull-up bar with an overhand (pronated) grip slightly wider than shoulder width.',
      'Hang at a complete dead-hang with core braced and legs straight or crossed.'
    ],
    executionInstructions: [
      'Depress scapulae down first, then pull elbows down and back toward your ribcage.',
      'Pull until your chin clears the bar cleanly.',
      'Lower down under complete control back to full dead hang.'
    ],
    formCues: [
      'Think about driving your elbows into your back pockets.',
      'Lead with your upper chest toward the bar, not your chin reaching up.'
    ],
    commonMistakes: [
      'Kicking legs or using kipping momentum.',
      'Cutting the bottom range of motion by not returning to full extension.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/eGo4IYlbE5g?rel=0&modestbranding=1',
    videoSourceTitle: 'Pull-Up Form Blueprint',
    workoutGuideSlug: 'pull-up',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/lBDjFxJ.gif'
  },
  {
    id: 'barbell-bent-row',
    name: 'Barbell Bent-Over Row',
    category: 'Back',
    equipment: 'Barbell',
    defaultRestSeconds: 90,
    difficulty: 'Intermediate',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Trapezius'],
    secondaryMuscles: ['Posterior Deltoids', 'Biceps', 'Spinal Erectors'],
    description: 'Heavy compound horizontal row developing thick upper back musculature and hip hinge endurance.',
    setupInstructions: [
      'Stand with feet hip-width apart and hinge forward at hips to roughly 45 degrees (or parallel).',
      'Grip bar slightly wider than shoulder-width with arms hanging straight.'
    ],
    executionInstructions: [
      'Brace core firmly and pull barbell toward your belly button.',
      'Drive elbows up and squeeze shoulder blades firmly together at top.',
      'Lower barbell under control back to full arm extension without dropping chest.'
    ],
    formCues: [
      'Keep torso angle stationary throughout reps.',
      'Pull with your elbows, not with biceps or wrists.'
    ],
    commonMistakes: [
      'Using aggressive torso heaving and hip thrusting to move the weight.',
      'Allowing lower back to round into flexion.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/FWJR5Ve8gkQ?rel=0&modestbranding=1',
    videoSourceTitle: 'Bent Over Row Form',
    workoutGuideSlug: 'barbell-row',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/eZyBC3j.gif'
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'Back',
    equipment: 'Cable',
    defaultRestSeconds: 75,
    difficulty: 'Beginner',
    targetMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Biceps', 'Rhomboids'],
    description: 'Controlled vertical pulling exercise on a cable station, ideal for progressive overload on back width.',
    setupInstructions: [
      'Adjust thigh pad snugly over knees with feet flat on the floor.',
      'Grip wide bar just outside bend with overhand grip and sit down.'
    ],
    executionInstructions: [
      'Lean back very slightly (10-15 degrees) with chest lifted.',
      'Pull bar down smoothly toward upper chest, driving elbows downward.',
      'Control the bar on the ascent until lats are completely stretched.'
    ],
    formCues: [
      'Keep chest puffed high to meet the bar.',
      'Squeeze shoulder blades down and in at bottom.'
    ],
    commonMistakes: [
      'Leaning back 45+ degrees and turning the movement into a sloppy row.',
      'Pulling bar behind the neck (dangerous for cervical spine and rotator cuff).'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/CAwf7n6Luuc?rel=0&modestbranding=1',
    videoSourceTitle: 'Lat Pulldown Execution',
    workoutGuideSlug: 'lat-pulldown',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/RVwzP10.gif'
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'Back',
    equipment: 'Cable',
    defaultRestSeconds: 75,
    difficulty: 'Beginner',
    targetMuscles: ['Mid-Traps', 'Rhomboids', 'Lats'],
    secondaryMuscles: ['Biceps', 'Erector Spinae'],
    description: 'Stabilized horizontal rowing targeting mid-back thickness and postural retraction.',
    setupInstructions: [
      'Sit upright on bench with feet placed on footrests and knees slightly bent.',
      'Grip V-bar handle and sit tall with shoulders packed.'
    ],
    executionInstructions: [
      'Pull handle toward lower abdomen while keeping spine neutral.',
      'Squeeze scapulae together at full contraction.',
      'Slowly extend arms forward, allowing shoulder blades to open naturally without rounding back.'
    ],
    formCues: [
      'Keep chest proud and elbows tucked close to your torso.',
      'Resist excessive forward and backward swinging of the torso.'
    ],
    commonMistakes: [
      'Swinging torso through large momentum swings to cheat the load.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/GZbfZ033f74?rel=0&modestbranding=1',
    videoSourceTitle: 'Seated Cable Row Technique',
    workoutGuideSlug: 'seated-row',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/fUBheHs.gif'
  },
  {
    id: 'single-arm-db-row',
    name: 'Single-Arm Dumbbell Row',
    category: 'Back',
    equipment: 'Dumbbell',
    defaultRestSeconds: 75,
    difficulty: 'Beginner',
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids'],
    secondaryMuscles: ['Biceps', 'Posterior Deltoid'],
    description: 'Unilateral back builder that lets you train each side with maximum focus and range of motion.',
    setupInstructions: [
      'Place one knee and matching hand on a flat bench for support.',
      'Keep opposite foot planted on the floor with torso parallel to the bench.'
    ],
    executionInstructions: [
      'Hold dumbbell hanging straight down with neutral grip.',
      'Pull dumbbell in an arc up toward your hip, driving elbow high.',
      'Lower under control to feel deep lat stretch at bottom.'
    ],
    formCues: [
      'Think of rowing the dumbbell in an arc towards your pocket.',
      'Keep shoulders square to the bench without rotating your torso.'
    ],
    commonMistakes: [
      'Jerking torso violently upwards to yank the dumbbell.',
      'Rowing straight up toward shoulder instead of back toward hip.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/pYcpY20QaE8?rel=0&modestbranding=1',
    videoSourceTitle: 'Dumbbell Row Mechanics',
    workoutGuideSlug: 'one-arm-dumbbell-row',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/C0MA9bC.gif'
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    category: 'Back',
    equipment: 'Barbell',
    defaultRestSeconds: 90,
    difficulty: 'Intermediate',
    targetMuscles: ['Middle Trapezius', 'Rhomboids', 'Lats'],
    secondaryMuscles: ['Biceps', 'Spinal Erectors'],
    description: 'Classic landmine/T-bar rowing compound movement for serious back thickness and grip conditioning.',
    setupInstructions: [
      'Straddle landmine bar with close-grip handle attached beneath the collar.',
      'Hinge at hips with knees bent and flat back.'
    ],
    executionInstructions: [
      'Pull handle towards lower ribs while maintaining rigid spinal posture.',
      'Contract back at top and pause briefly.',
      'Lower weight smoothly without letting plates touch ground between reps.'
    ],
    formCues: [
      'Lock core down tight to protect lumbar spine.',
      'Keep elbows tracking back along body.'
    ],
    commonMistakes: [
      'Rounding upper and lower back when fatigued.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/j3Igk5-QzVU?rel=0&modestbranding=1',
    videoSourceTitle: 'T-Bar Row Form',
    workoutGuideSlug: 't-bar-row',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/aaXr7ld.gif'
  },

  // LEGS
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    category: 'Legs',
    equipment: 'Barbell',
    defaultRestSeconds: 180,
    difficulty: 'Advanced',
    targetMuscles: ['Quadriceps', 'Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Adductors', 'Calves', 'Spinal Erectors'],
    description: 'The king of lower body movements, demanding total-body stability, leg drive, and hip mobility.',
    setupInstructions: [
      'Step under bar inside squat rack; position bar across upper traps (high bar) or rear delts (low bar).',
      'Unrack with feet shoulder-width apart, toes flared slightly 15–30 degrees.',
      'Take 2-3 clean steps back, brace abdomen 360 degrees, and lock gaze forward.'
    ],
    executionInstructions: [
      'Break simultaneously at hips and knees, sitting down into the space between your thighs.',
      'Keep chest proud and drive knees out in line with your toes.',
      'Descend until hip crease is below top of knees (parallel or below).',
      'Drive powerfully out of the hole by pushing through mid-foot and extending hips and knees together.'
    ],
    formCues: [
      'Screw your feet into the floor to generate external hip rotation.',
      'Keep torso angle consistent on ascent (prevent chest collapse).',
      'Breathe into stomach and brace like preparing for a gut punch.'
    ],
    commonMistakes: [
      'Knees caving inward (valgus collapse) on the ascent.',
      'Rising on toes or lifting heels off the floor.',
      'Cutting depth high above parallel.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/bEv6CCg2BC8?rel=0&modestbranding=1',
    videoSourceTitle: 'Back Squat Technique',
    animationGifUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Bodyweight_Squats.gif',
    loopDurationSeconds: 4,
    workoutGuideSlug: 'squat',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/qXTaZnJ.gif'
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift (RDL)',
    category: 'Legs',
    equipment: 'Barbell',
    defaultRestSeconds: 120,
    difficulty: 'Intermediate',
    targetMuscles: ['Hamstrings', 'Gluteus Maximus'],
    secondaryMuscles: ['Erector Spinae', 'Forearms'],
    description: 'Pure hip hinge movement prioritizing eccentric hamstring elongation and glute strength.',
    setupInstructions: [
      'Stand tall holding barbell with shoulder-width overhand grip.',
      'Feet hip-width apart, soft bend in knees (maintain this static knee bend).'
    ],
    executionInstructions: [
      'Push hips back as far as possible like reaching for a wall behind you.',
      'Lower barbell down along thighs while keeping back completely flat and lats tight.',
      'Stop when you feel maximum hamstring tension (usually just below knees).',
      'Squeeze glutes and thrust hips forward to return to standing.'
    ],
    formCues: [
      'Movement is purely horizontal hip translation, not squatting down.',
      'Keep the barbell glued close to your legs at all times.'
    ],
    commonMistakes: [
      'Squatting and bending knees further instead of hinging.',
      'Rounding lower spine to reach the floor.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/JCXUYuzwNrM?rel=0&modestbranding=1',
    videoSourceTitle: 'Romanian Deadlift Guide',
    workoutGuideSlug: 'romanian-deadlift',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/wQ2c4XD.gif'
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'Legs',
    equipment: 'Machine',
    defaultRestSeconds: 120,
    difficulty: 'Beginner',
    targetMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    description: 'High-load machine compound pushing exercise removing spinal loading for pure quad and leg overload.',
    setupInstructions: [
      'Sit comfortably with lower back and tailbone completely flat against the back pad.',
      'Place feet shoulder-width apart on the sled platform.'
    ],
    executionInstructions: [
      'Release safety handles and lower sled under control until knees reach 90 degrees.',
      'Press through full foot back up without hyperextending or locking knees at the top.'
    ],
    formCues: [
      'Keep glutes and lower back glued into seat pad at all times.',
      'Never hyperextend/lock out knees violently at the peak.'
    ],
    commonMistakes: [
      'Letting pelvis roll forward off seat (causes high lumbar shear stress).',
      'Short-stepping half reps.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/IZxyjW7MPJQ?rel=0&modestbranding=1',
    videoSourceTitle: 'Leg Press Form',
    workoutGuideSlug: 'leg-press',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/10Z2DXU.gif'
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    category: 'Legs',
    equipment: 'Dumbbell',
    defaultRestSeconds: 90,
    difficulty: 'Advanced',
    targetMuscles: ['Quadriceps', 'Gluteus Medius / Maximus'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Core'],
    description: 'Unilateral leg builder that ruthlessly exposes balance discrepancies and develops brutal single-leg power.',
    setupInstructions: [
      'Stand 2-3 feet in front of bench. Place top of rear foot laces-down on the bench.',
      'Hold dumbbells at sides or goblet style.'
    ],
    executionInstructions: [
      'Lower front hip straight down until front thigh is parallel to the ground.',
      'Keep torso slightly tilted forward to bias glutes or upright for quad bias.',
      'Drive up through whole front foot to return to start.'
    ],
    formCues: [
      '80% of weight belongs on front working leg; rear leg is only for balance.',
      'Ensure front knee tracks over 2nd and 3rd toes.'
    ],
    commonMistakes: [
      'Placing front foot too close to bench, crowding the knee joint.',
      'Pushing aggressively with the back leg.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/2C-uNgKwPLE?rel=0&modestbranding=1',
    videoSourceTitle: 'Bulgarian Split Squat Mastery',
    workoutGuideSlug: 'bulgarian-split-squat',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/qx4fgX7.gif'
  },
  {
    id: 'hamstring-curl-lying',
    name: 'Lying Leg Curl',
    category: 'Legs',
    equipment: 'Machine',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Hamstrings (Biceps Femoris, Semitendinosus)'],
    secondaryMuscles: ['Gastrocnemius (Calves)'],
    description: 'Direct knee-flexion hamstring isolation ensuring balanced posterior leg development.',
    setupInstructions: [
      'Lie face down on machine with knee joints aligned with machine pivot axis.',
      'Position padded lever just below calves against Achilles tendons.'
    ],
    executionInstructions: [
      'Curl heels up toward glutes in a controlled contraction.',
      'Hold squeeze at top for 1 second.',
      'Lower slowly under eccentric control for 3 seconds back to start.'
    ],
    formCues: [
      'Keep hips pushed down into the pad throughout movement.',
      'Dorsiflex toes (point toes toward shins) for optimal tension.'
    ],
    commonMistakes: [
      'Lifting hips off pad to heave weight up.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/1Tq3QdYUuHs?rel=0&modestbranding=1',
    videoSourceTitle: 'Lying Leg Curl Guide',
    workoutGuideSlug: 'lying-leg-curl',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/17lJ1kr.gif'
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    category: 'Legs',
    equipment: 'Machine',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Quadriceps (Rectus Femoris, Vastus Lateralis/Medialis)'],
    secondaryMuscles: [],
    description: 'Open-chain knee extension machine isolating quadriceps in the shortened position.',
    setupInstructions: [
      'Sit with back flat against pad, knees aligned with machine pivot point.',
      'Pad should rest comfortably against lower shins just above ankles.'
    ],
    executionInstructions: [
      'Extend knees to kick pad upward until legs are almost straight.',
      'Pause and contract quads hard at the top.',
      'Control descent back down smoothly.'
    ],
    formCues: [
      'Hold side handles tightly to anchor hips into the seat.',
      'Control the negative rather than dropping the weight stack.'
    ],
    commonMistakes: [
      'Kicking violently with momentum.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/YyvSfV64228?rel=0&modestbranding=1',
    videoSourceTitle: 'Leg Extension Technique',
    workoutGuideSlug: 'leg-extension',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/my33uHU.gif'
  },
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    category: 'Legs',
    equipment: 'Machine',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Gastrocnemius (Calves)'],
    secondaryMuscles: ['Soleus'],
    description: 'Direct loaded calf exercise developing lower leg power and ankle stiffness.',
    setupInstructions: [
      'Place balls of feet on edge of platform with heels hanging over.',
      'Shoulder pads resting comfortably on top of shoulders.'
    ],
    executionInstructions: [
      'Drop heels down for a full deep calf stretch for 2 seconds.',
      'Drive through balls of feet and big toes to raise heels as high as possible.',
      'Squeeze calves hard at the peak.'
    ],
    formCues: [
      'Pause at bottom stretch to eliminate Achilles tendon spring rebound.',
      'Keep knees softly straight, not bent.'
    ],
    commonMistakes: [
      'Bouncing rapidly at bottom without controlling stretch.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/gwLzBJYoWlI?rel=0&modestbranding=1',
    videoSourceTitle: 'Calf Raise Execution',
    workoutGuideSlug: 'standing-calf-raise',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/8ozhUIZ.gif'
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    category: 'Legs',
    equipment: 'Dumbbell',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Core', 'Upper Back'],
    description: 'Accessible front-loaded squat variation teaching perfect upright torso posture and depth.',
    setupInstructions: [
      'Hold dumbbell vertically against chest with palms cupping the top head.',
      'Stand with feet shoulder-width, toes turned slightly out.'
    ],
    executionInstructions: [
      'Sit between heels, keeping elbows tracking inside knees.',
      'Descend until thighs break parallel, keeping chest high.',
      'Push floor away to stand tall.'
    ],
    formCues: [
      'Keep dumbbell in constant contact with sternum.',
      'Use elbows to gently push knees out at the bottom.'
    ],
    commonMistakes: [
      'Letting dumbbell drift away from chest.',
      'Rounding upper thoracic spine.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/MeIiIdhvXT4?rel=0&modestbranding=1',
    videoSourceTitle: 'Goblet Squat Form',
    workoutGuideSlug: 'goblet-squat',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/yn8yg1r.gif'
  },

  // SHOULDERS
  {
    id: 'overhead-press-barbell',
    name: 'Overhead Barbell Press',
    category: 'Shoulders',
    equipment: 'Barbell',
    defaultRestSeconds: 120,
    difficulty: 'Intermediate',
    targetMuscles: ['Anterior Deltoids', 'Lateral Deltoids'],
    secondaryMuscles: ['Triceps Brachii', 'Upper Trapezius', 'Core'],
    description: 'The definitive standing compound overhead lift for upper body pressing prowess and core rigidity.',
    setupInstructions: [
      'Rest bar across clavicles and front delts with hands just outside shoulders.',
      'Stand with feet hip-width apart, squeeze glutes, quads, and abs tight.'
    ],
    executionInstructions: [
      'Tilt head slightly back to clear chin path as you press bar straight upward.',
      'Once bar clears forehead, push head forward back to neutral window beneath bar.',
      'Lock out overhead with arms fully extended, shrugging shoulders up slightly.'
    ],
    formCues: [
      'Squeeze glutes rock hard to prevent lower back hyperextension.',
      'Keep forearms strictly perpendicular to floor before pressing.'
    ],
    commonMistakes: [
      'Excessive backward lean turning press into an incline bench press.',
      'Pressing bar forward around face instead of straight up.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/2yjwXTZQDDI?rel=0&modestbranding=1',
    videoSourceTitle: 'Overhead Press Tutorial',
    workoutGuideSlug: 'overhead-press',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/kTbSH9h.gif'
  },
  {
    id: 'seated-db-shoulder-press',
    name: 'Seated Dumbbell Shoulder Press',
    category: 'Shoulders',
    equipment: 'Dumbbell',
    defaultRestSeconds: 90,
    difficulty: 'Intermediate',
    targetMuscles: ['Anterior Deltoids', 'Lateral Deltoids'],
    secondaryMuscles: ['Triceps Brachii'],
    description: 'Stabilized seated dumbbell press allowing heavy shoulder loading without balance fatigue.',
    setupInstructions: [
      'Set bench to 80–85 degrees (nearly upright). Sit with back supported.',
      'Bring dumbbells to shoulder height with palms facing forward or slightly angled.'
    ],
    executionInstructions: [
      'Press dumbbells overhead until arms are extended above crown of head.',
      'Lower weights steadily down until dumbbells reach ear/shoulder level.'
    ],
    formCues: [
      'Keep elbows angled slightly forward in the scapular plane (not flared 180° flat).',
      'Plant feet firmly to maintain base.'
    ],
    commonMistakes: [
      'Arching lower back off bench pad.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/qEwKCR5JCog?rel=0&modestbranding=1',
    videoSourceTitle: 'Dumbbell Shoulder Press',
    workoutGuideSlug: 'seated-dumbbell-press',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/znQUdHY.gif'
  },
  {
    id: 'lateral-raises-db',
    name: 'Lateral Raises',
    category: 'Shoulders',
    equipment: 'Dumbbell',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Lateral Deltoids (Side Delts)'],
    secondaryMuscles: ['Supraspinatus', 'Upper Trapezius'],
    description: 'Essential isolation movement for creating shoulder width and the coveted 3D capped deltoid look.',
    setupInstructions: [
      'Stand tall holding dumbbells at sides with slight forward torso lean (10°).',
      'Micro-bend in elbows that remains fixed.'
    ],
    executionInstructions: [
      'Raise arms out to sides in scapular plane until parallel to the floor.',
      'Lead with elbows and lateral delts, pausing for a split second at top.',
      'Lower slowly under control for 2 seconds.'
    ],
    formCues: [
      'Think about pushing dumbbells out toward the walls rather than up.',
      'Keep pinky slightly higher than thumb like pouring water from a pitcher.'
    ],
    commonMistakes: [
      'Shrugging traps up to neck to cheat the weight.',
      'Using swinging leg momentum to fling heavy dumbbells.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/3VcKaXpzqRo?rel=0&modestbranding=1',
    videoSourceTitle: 'Lateral Raise Guide',
    workoutGuideSlug: 'lateral-raise',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/DsgkuIt.gif'
  },
  {
    id: 'cable-face-pull',
    name: 'Cable Face Pull',
    category: 'Shoulders',
    equipment: 'Cable',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Rear Deltoids', 'Rotator Cuff (Infraspinatus, Teres Minor)'],
    secondaryMuscles: ['Rhomboids', 'Mid-Trapezius'],
    description: 'Unmatched postural and shoulder health exercise combining horizontal rowing with external rotation.',
    setupInstructions: [
      'Attach rope handle to cable pulley at upper chest / face height.',
      'Grip ends of rope with thumbs pointing backward or overhand.'
    ],
    executionInstructions: [
      'Step back, take an athletic stance, and pull center of rope toward bridge of nose.',
      'At peak, externally rotate shoulders so hands finish beside ears in a double-bicep flex.',
      'Hold squeeze for 1 second, then extend arms smoothly.'
    ],
    formCues: [
      'Separate the rope ends as wide as possible at finish.',
      'Lead with knuckles and rotate elbows up and back.'
    ],
    commonMistakes: [
      'Pulling too low toward chest like a normal row.',
      'Using body momentum to heave the cable stack.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/rep-qVOkqgk?rel=0&modestbranding=1',
    videoSourceTitle: 'Face Pull Form Blueprint',
    workoutGuideSlug: 'face-pull',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/ZfyAGhK.gif'
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Flyes',
    category: 'Shoulders',
    equipment: 'Dumbbell',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Posterior Deltoids (Rear Delts)'],
    secondaryMuscles: ['Rhomboids', 'Mid Traps'],
    description: 'Direct rear shoulder isolation to balance out heavy chest pressing volume.',
    setupInstructions: [
      'Hinge forward at hips until torso is roughly parallel to floor.',
      'Dumbbells hanging naturally under chest with elbows slightly unlocked.'
    ],
    executionInstructions: [
      'Raise arms wide out to sides, feeling rear delts contract.',
      'Squeeze for a brief pause at peak height.',
      'Lower down smoothly without letting dumbbells bang together.'
    ],
    formCues: [
      'Focus on pulling with the back of the shoulders.',
      'Do not pinch shoulder blades aggressively together if isolating rear delts.'
    ],
    commonMistakes: [
      'Using excessive weight and standing up during reps.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/EA7u4Q_8HQ0?rel=0&modestbranding=1',
    videoSourceTitle: 'Rear Delt Fly Execution',
    workoutGuideSlug: 'rear-delt-fly',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/mu5Guxt.gif'
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    category: 'Shoulders',
    equipment: 'Dumbbell',
    defaultRestSeconds: 75,
    difficulty: 'Intermediate',
    targetMuscles: ['Anterior & Lateral Deltoids'],
    secondaryMuscles: ['Triceps Brachii'],
    description: 'Rotational shoulder press variation activating all three deltoid heads through an extended range of motion.',
    setupInstructions: [
      'Sit on upright bench holding dumbbells at chest height, palms facing in toward your face.',
    ],
    executionInstructions: [
      'As you press upward, rotate wrists so palms face forward at the top lockout.',
      'Reverse the rotation as you lower back down under control to starting position.'
    ],
    formCues: [
      'Make the press and rotation one fluid continuous motion.',
      'Do not rush the eccentric return.'
    ],
    commonMistakes: [
      'Rotating too quickly before the weight clears the shoulders.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/6Z15_WdxmVw?rel=0&modestbranding=1',
    videoSourceTitle: 'Arnold Press Guide',
    workoutGuideSlug: 'arnold-press',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/Xy4jlWA.gif'
  },

  // ARMS
  {
    id: 'barbell-bicep-curl',
    name: 'Barbell Bicep Curl',
    category: 'Arms',
    equipment: 'Barbell',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Biceps Brachii (Short & Long Heads)'],
    secondaryMuscles: ['Brachialis', 'Forearm Flexors'],
    description: 'Heavy bilateral bicep curl allowing maximum mechanical tension across the arm flexors.',
    setupInstructions: [
      'Stand tall holding barbell with shoulder-width underhand (supinated) grip.',
      'Pin elbows firmly by your ribs with shoulders depressed.'
    ],
    executionInstructions: [
      'Curl bar up in an arc toward upper chest while keeping elbows stationary.',
      'Squeeze biceps forcefully at peak height for 1 count.',
      'Lower bar steadily down under complete eccentric control back to full extension.'
    ],
    formCues: [
      'Keep elbows locked as the rotational pivot point.',
      'Do not swing hips or lean backward to initiate movement.'
    ],
    commonMistakes: [
      'Swinging hips and lumbar spine forward.',
      'Letting elbows drift far forward, taking tension off biceps onto front delts.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/kwG2ipFRgfo?rel=0&modestbranding=1',
    videoSourceTitle: 'Barbell Bicep Curl Form',
    workoutGuideSlug: 'bicep-curl',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/25GPyDY.gif'
  },
  {
    id: 'incline-db-curl',
    name: 'Incline Dumbbell Curl',
    category: 'Arms',
    equipment: 'Dumbbell',
    defaultRestSeconds: 60,
    difficulty: 'Intermediate',
    targetMuscles: ['Biceps Brachii (Long Head / Bicep Peak)'],
    secondaryMuscles: ['Brachialis'],
    description: 'Positions the shoulder in extension, placing maximal stretch on the long head of the bicep.',
    setupInstructions: [
      'Set bench to 45–60 degree incline. Lie back with arms hanging straight down.',
      'Hold dumbbells with palms facing inward (neutral).'
    ],
    executionInstructions: [
      'Supinate wrists (turn palms up) as you curl dumbbells upward.',
      'Squeeze biceps hard at top without letting elbows move forward.',
      'Lower weights smoothly to full elbow extension for an intense stretch.'
    ],
    formCues: [
      'Keep shoulders and upper arms pointing straight down toward floor.',
      'Emphasize the deep stretch at the bottom of every rep.'
    ],
    commonMistakes: [
      'Lifting shoulders off bench pad to assist the curl.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/soxrZlIl35U?rel=0&modestbranding=1',
    videoSourceTitle: 'Incline Curl Execution',
    workoutGuideSlug: 'incline-dumbbell-curl',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/F3xgbjF.gif'
  },
  {
    id: 'hammer-curls',
    name: 'Hammer Curls',
    category: 'Arms',
    equipment: 'Dumbbell',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Brachialis', 'Brachioradialis (Forearms)'],
    secondaryMuscles: ['Biceps Brachii'],
    description: 'Neutral-grip curl building forearm density, grip strength, and pushing the bicep peak upwards.',
    setupInstructions: [
      'Stand upright with dumbbells hanging at sides, palms facing inward (neutral grip).'
    ],
    executionInstructions: [
      'Curl dumbbells upward while keeping palms facing each other throughout.',
      'Pause at top contraction and squeeze forearms and brachialis.',
      'Lower weights steadily.'
    ],
    formCues: [
      'Maintain palms-facing neutral position 100% of the movement.',
      'Keep elbows snug against ribs.'
    ],
    commonMistakes: [
      'Swinging body backwards to heave heavy dumbbells.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/zC3nLlEvin4?rel=0&modestbranding=1',
    videoSourceTitle: 'Hammer Curl Form',
    workoutGuideSlug: 'hammer-curl',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/2NpxjC1.gif'
  },
  {
    id: 'tricep-rope-pushdown',
    name: 'Tricep Rope Pushdown',
    category: 'Arms',
    equipment: 'Cable',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Triceps Brachii (Lateral & Medial Heads)'],
    secondaryMuscles: ['Anconeus'],
    description: 'High-tension cable tricep isolation with rope attachment allowing full lateral lockouts.',
    setupInstructions: [
      'Attach rope to high pulley. Stand with slight forward torso lean (10°).',
      'Grip rope ends and pin elbows by sides with forearms at 90 degrees.'
    ],
    executionInstructions: [
      'Push rope down by extending elbows.',
      'Spread the rope ends apart at the bottom to achieve maximum tricep contraction.',
      'Return up under control to 90 degrees without letting elbows drift forward.'
    ],
    formCues: [
      'Lock upper arms in place like statues.',
      'Flare wrists outward at the bottom for peak lateral head tension.'
    ],
    commonMistakes: [
      'Allowing elbows to flare up and down during the movement.',
      'Leaning body weight directly over hands to press down.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/vB5OHsJ3EME?rel=0&modestbranding=1',
    videoSourceTitle: 'Tricep Pushdown Mechanics',
    workoutGuideSlug: 'rope-tricep-pushdown',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/3ZflifB.gif'
  },
  {
    id: 'skull-crushers',
    name: 'EZ-Bar Skull Crushers',
    category: 'Arms',
    equipment: 'Barbell',
    defaultRestSeconds: 75,
    difficulty: 'Intermediate',
    targetMuscles: ['Triceps Brachii (Long Head)'],
    secondaryMuscles: ['Triceps Medial/Lateral Heads'],
    description: 'Lying tricep extension placing massive eccentric loading on the long head of the triceps.',
    setupInstructions: [
      'Lie on flat bench holding EZ-bar with narrow overhand grip above chest.',
      'Angle upper arms slightly back toward head (roughly 75–80 degrees) instead of vertical.'
    ],
    executionInstructions: [
      'Bend elbows to lower bar smoothly towards forehead or top of head.',
      'Extend elbows powerfully to return to starting arm angle.'
    ],
    formCues: [
      'Keep elbows pointing straight forward, not flaring wide.',
      'Control the descent to protect elbows.'
    ],
    commonMistakes: [
      'Flaring elbows outward excessively.',
      'Dropping bar quickly towards head.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/d_KZxkY_0cM?rel=0&modestbranding=1',
    videoSourceTitle: 'Skull Crushers Technique',
    workoutGuideSlug: 'skull-crusher',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/h8LFzo9.gif'
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl Machine',
    category: 'Arms',
    equipment: 'Machine',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Biceps Brachii (Short Head)'],
    secondaryMuscles: ['Brachialis'],
    description: 'Arm curl strictly isolated on the preacher pad, eliminating cheating or body momentum.',
    setupInstructions: [
      'Adjust seat so armpit fits snugly over top of pad.',
      'Rest triceps flat against pad and grasp handles.'
    ],
    executionInstructions: [
      'Curl weight upward until biceps are contracted.',
      'Lower weight down smoothly until elbows are almost extended (avoid hyperextension).'
    ],
    formCues: [
      'Keep armpits tight against the top edge of pad.',
      'Maintain continuous tension throughout range.'
    ],
    commonMistakes: [
      'Hyperextending elbows abruptly under heavy weight at bottom.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/fIWP-FRFNU0?rel=0&modestbranding=1',
    videoSourceTitle: 'Preacher Curl Guide',
    workoutGuideSlug: 'preacher-curl',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/b6hQYMb.gif'
  },

  // CORE
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'Core',
    equipment: 'Bodyweight',
    defaultRestSeconds: 60,
    difficulty: 'Advanced',
    targetMuscles: ['Rectus Abdominis (Lower Abs)', 'Iliopsoas'],
    secondaryMuscles: ['Obliques', 'Forearms / Grip'],
    description: 'Dynamic gymnastics-grade core movement demanding active posterior pelvic tilt and deep abdominal compression.',
    setupInstructions: [
      'Hang from pull-up bar with overhand grip, shoulders engaged down, legs together.'
    ],
    executionInstructions: [
      'Tilt pelvis backward and raise legs upward with control toward parallel or higher.',
      'Curl lower spine upward to engage abs fully.',
      'Lower legs steadily back down without swinging.'
    ],
    formCues: [
      'Focus on curling your pelvis up toward your chest, not just lifting legs.',
      'Control the bottom stop to prevent swinging.'
    ],
    commonMistakes: [
      'Using swinging momentum like a pendulum.',
      'Relying only on hip flexors without pelvic tilt.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/hdng3Nm1x_E?rel=0&modestbranding=1',
    videoSourceTitle: 'Hanging Leg Raise Form',
    workoutGuideSlug: 'hanging-leg-raise',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/I3tsCnC.gif'
  },
  {
    id: 'cable-woodchoppers',
    name: 'Cable Woodchopper',
    category: 'Core',
    equipment: 'Cable',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Internal & External Obliques'],
    secondaryMuscles: ['Transverse Abdominis', 'Shoulders'],
    description: 'Rotational core power exercise building anti-rotation stability and athletic rotary torque.',
    setupInstructions: [
      'Set cable pulley to shoulder height. Stand sideways with feet wider than hip-width.',
      'Grasp handle with both hands, arms extended.'
    ],
    executionInstructions: [
      'Rotate torso across your body in a sweeping arc, pivoting on back foot.',
      'Squeeze obliques at peak rotation.',
      'Return slowly under cable tension.'
    ],
    formCues: [
      'Initiate rotation from your core and hips, not arms.',
      'Keep arms extended with soft elbow bend.'
    ],
    commonMistakes: [
      'Pulling exclusively with arms rather than rotating through the torso.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/pAplQXk3dkU?rel=0&modestbranding=1',
    videoSourceTitle: 'Cable Woodchopper Guide',
    workoutGuideSlug: 'cable-woodchop',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/fhZQPlV.gif'
  },
  {
    id: 'plank',
    name: 'Forearm Plank',
    category: 'Core',
    equipment: 'Bodyweight',
    defaultRestSeconds: 60,
    difficulty: 'Beginner',
    targetMuscles: ['Transverse Abdominis', 'Rectus Abdominis'],
    secondaryMuscles: ['Glutes', 'Quadriceps', 'Shoulders'],
    description: 'Isometric anti-extension core standard creating endurance and deep spinal bracing capacity.',
    setupInstructions: [
      'Rest on forearms with elbows directly under shoulders, feet together.'
    ],
    executionInstructions: [
      'Lift body off floor into an unbroken bridge from head to heels.',
      'Squeeze glutes, brace abs hard, and press forearms into floor.',
      'Breathe rhythmically while holding rigid tension.'
    ],
    formCues: [
      'Tuck pelvis into posterior tilt (squeeze glutes tight).',
      'Push shoulder blades apart (scapular protraction).'
    ],
    commonMistakes: [
      'Sagging hips towards floor (hyperextending lower back).',
      'Piking hips high up into the air.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/pSHjTRCQxIw?rel=0&modestbranding=1',
    videoSourceTitle: 'Perfect Plank Technique',
    workoutGuideSlug: 'plank',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/VBAWRPG.gif'
  },
  {
    id: 'ab-wheel-rollout',
    name: 'Ab Wheel Rollout',
    category: 'Core',
    equipment: 'Bodyweight',
    defaultRestSeconds: 60,
    difficulty: 'Advanced',
    targetMuscles: ['Rectus Abdominis', 'Transverse Abdominis'],
    secondaryMuscles: ['Lats', 'Shoulders'],
    description: 'High-leverage anti-extension rollout delivering extreme eccentric tensile overload to the core.',
    setupInstructions: [
      'Kneel on pad holding ab wheel with both hands directly under shoulders.'
    ],
    executionInstructions: [
      'Round upper back slightly, tuck pelvis, and roll wheel forward smoothly.',
      'Extend as far forward as you can while maintaining neutral/tucked spine.',
      'Pull wheel back towards knees by contracting abdominals.'
    ],
    formCues: [
      'Never allow your lower back to arch or sag towards the floor.',
      'Keep glutes squeezed throughout.'
    ],
    commonMistakes: [
      'Collapsing lower back into extension under heavy leverage.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/rqiTPdK1cWg?rel=0&modestbranding=1',
    videoSourceTitle: 'Ab Wheel Rollout Blueprint',
    workoutGuideSlug: 'ab-wheel',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/zhF9lW4.gif'
  },

  // CARDIO & FULL BODY
  {
    id: 'treadmill-sprints',
    name: 'HIIT Treadmill Sprints',
    category: 'Cardio',
    equipment: 'Cardio',
    defaultRestSeconds: 60,
    difficulty: 'Intermediate',
    targetMuscles: ['Cardiovascular System', 'Hamstrings', 'Calves', 'Glutes'],
    secondaryMuscles: ['Quadriceps', 'Core'],
    description: 'High-intensity interval sprinting for maximum VO2 max expansion and post-exercise oxygen consumption.',
    setupInstructions: [
      'Set treadmill speed to target sprint velocity and safety clip attached.',
      'Warm up with light jog before initiating intervals.'
    ],
    executionInstructions: [
      'Carefully mount belt and sprint with full arm drive and high knee recovery.',
      'Maintain tall posture and land on mid-foot.',
      'At end of interval, step feet safely onto side rails to rest.'
    ],
    formCues: [
      'Drive arms aggressively from hip to cheek.',
      'Keep head neutral and avoid over-striding.'
    ],
    commonMistakes: [
      'Holding onto treadmill handrails during sprinting.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/u3VTK5a3X2g?rel=0&modestbranding=1',
    videoSourceTitle: 'Sprinting Form Mechanics',
    workoutGuideSlug: 'running',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/rjiM4L3.gif'
  },
  {
    id: 'concept2-rower',
    name: 'Rowing Ergometer',
    category: 'Cardio',
    equipment: 'Cardio',
    defaultRestSeconds: 90,
    difficulty: 'Intermediate',
    targetMuscles: ['Legs (Quads/Glutes)', 'Back (Lats/Traps)', 'Cardiovascular'],
    secondaryMuscles: ['Core', 'Forearms'],
    description: 'Low-impact full-body aerobic and anaerobic power output recruiting 85% of body musculature.',
    setupInstructions: [
      'Secure feet in foot-straps over widest part of shoes. Set damper between 3 and 5.',
      'Grip handle with relaxed overhand grip.'
    ],
    executionInstructions: [
      'Catch: Shins vertical, arms extended, torso tilted forward at 1 o’clock.',
      'Drive: Push legs forcefully first (60%), swing torso back (20%), then pull arms into lower ribs (20%).',
      'Recovery: Extend arms first, hinge torso forward, then slide legs forward smoothly.'
    ],
    formCues: [
      'Sequence: Legs → Core → Arms on drive; Arms → Core → Legs on recovery.',
      'Drive comes 60% from the legs, not arms.'
    ],
    commonMistakes: [
      'Bending knees early on the recovery, causing handle to collide with knees.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/H0r_ZGSBf8c?rel=0&modestbranding=1',
    videoSourceTitle: 'Rowing Ergometer Technique',
    workoutGuideSlug: 'rowing',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/7I6LNUG.gif'
  },
  {
    id: 'air-bike',
    name: 'Echo / Assault Air Bike',
    category: 'Cardio',
    equipment: 'Cardio',
    defaultRestSeconds: 60,
    difficulty: 'Intermediate',
    targetMuscles: ['Total Body Conditioning', 'Legs', 'Shoulders'],
    secondaryMuscles: ['Triceps', 'Chest', 'Lats'],
    description: 'Exponential wind-resistance bike punishing every energy system with synchronous upper/lower body output.',
    setupInstructions: [
      'Adjust seat height so knee has slight bend at bottom of pedal stroke.',
      'Seat forward/aft should allow natural reach on handles.'
    ],
    executionInstructions: [
      'Pedal powerfully while pushing and pulling the handles in rhythm.',
      'Maintain smooth cadence and rhythmic breathing.'
    ],
    formCues: [
      'Coordinate push/pull of upper body with leg drive.',
      'Do not rock hips side to side.'
    ],
    commonMistakes: [
      'Flaring knees outward away from frame.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/7X8mOD7q3wA?rel=0&modestbranding=1',
    videoSourceTitle: 'Air Bike Performance Guide',
    workoutGuideSlug: 'assault-bike',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/H1PESYI.gif'
  },
  {
    id: 'kettlebell-swings',
    name: 'Kettlebell Swings',
    category: 'Full Body',
    equipment: 'Dumbbell',
    defaultRestSeconds: 60,
    difficulty: 'Intermediate',
    targetMuscles: ['Gluteus Maximus', 'Hamstrings', 'Latissimus Dorsi'],
    secondaryMuscles: ['Core', 'Forearms', 'Shoulders'],
    description: 'Ballistic posterior chain hip hinge developing explosive power, hip drive, and anaerobic stamina.',
    setupInstructions: [
      'Stand with feet shoulder-width, kettlebell on floor 1 foot in front of you.',
      'Hinge hips, grip handle with both hands, and tilt bell back towards you.'
    ],
    executionInstructions: [
      'Hike bell between legs high near groin like a football snap.',
      'Snap hips forward violently, standing tall and projecting bell to chest height.',
      'Let bell free-fall back into the hip hinge and repeat smoothly.'
    ],
    formCues: [
      'Hinge at hips, never squat down.',
      'Bell is propelled by explosive hip snap, not lifted by the shoulders.'
    ],
    commonMistakes: [
      'Squatting with knees bent too much.',
      'Lifting with arms and shoulders rather than hip snap.'
    ],
    videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/sSESeQAir2M?rel=0&modestbranding=1',
    videoSourceTitle: 'Kettlebell Swing Mastery',
    workoutGuideSlug: 'kettlebell-swing',
    exerciseDbGifUrl: 'https://static.exercisedb.dev/media/UHJlbu3.gif'
  }
,
  {
  id: 'seated-shoulder-press-machine',
  name: 'Seated Shoulder Press Machine',
  category: 'Shoulders',
  equipment: 'Machine',
  defaultRestSeconds: 90,
  difficulty: 'Beginner',
  targetMuscles: [
    'Anterior Deltoids',
    'Lateral Deltoids'
  ],
  secondaryMuscles: [
    'Triceps Brachii',
    'Upper Trapezius'
  ],
  description: 'Stabilized overhead pressing machine providing continuous resistance curves and safe deltoid overload without balance limitations.',
  setupInstructions: [
    'Adjust seat height so handles align approximately at ear level.',
    'Sit tall with your back and head firmly against the padded backrest.',
    'Grip the horizontal or neutral handles firmly with palms facing forward.'
  ],
  executionInstructions: [
    'Press smoothly upward until elbows are almost locked out above head.',
    'Lower under controlled eccentric tension until hands return to ear level.',
    'Maintain continuous tension without letting the weight stack slam at the bottom.'
  ],
  formCues: [
    'Keep shoulder blades packed against the seat backrest.',
    'Do not arch your lower back off the pad during heavy presses.'
  ],
  commonMistakes: [
    'Setting seat too low causing extreme shoulder impingement at start.',
    'Bouncing out of bottom position.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/Wqq43dKW1TU?rel=0&modestbranding=1',
  videoSourceTitle: 'Machine Shoulder Press Form Guide',
  workoutGuideSlug: 'machine-shoulder-press',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/67n3r98.gif'
},
  {
  id: 'cable-lateral-raise',
  name: 'Cable Lateral Raises',
  category: 'Shoulders',
  equipment: 'Cable',
  defaultRestSeconds: 60,
  difficulty: 'Intermediate',
  targetMuscles: [
    'Lateral Deltoids (Side Delts)'
  ],
  secondaryMuscles: [
    'Anterior Deltoids',
    'Supraspinatus',
    'Trapezius'
  ],
  description: 'Premier shoulder isolation movement delivering constant horizontal cable tension across the full side-delt abduction range of motion.',
  setupInstructions: [
    'Set pulley to lowest peg or wrist height with single D-handle attached.',
    'Stand sideways to cable machine with feet shoulder-width.',
    'Grip handle across body with slight forward torso lean.'
  ],
  executionInstructions: [
    'Raise arm out to the side in the scapular plane (roughly 15–30 degrees forward).',
    'Lift until elbow reaches parallel to shoulder level.',
    'Pause for peak contraction, then lower under a 2-second eccentric cadence.'
  ],
  formCues: [
    'Lead with your elbow, not your wrist or knuckles.',
    'Keep traps relaxed—do not shrug your shoulders upward.'
  ],
  commonMistakes: [
    'Swinging torso or using momentum from legs.',
    'Raising above parallel which shifts focus entirely to upper traps.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/PPrzBWZDOhA?rel=0&modestbranding=1',
  videoSourceTitle: 'Cable Lateral Raise Form Mastery',
  workoutGuideSlug: 'cable-lateral-raise',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/goJ6ezq.gif'
},
  {
  id: 'chest-supported-row',
  name: 'Chest-Supported Row',
  category: 'Back',
  equipment: 'Machine',
  defaultRestSeconds: 90,
  difficulty: 'Beginner',
  targetMuscles: [
    'Rhomboids',
    'Middle & Lower Trapezius',
    'Latissimus Dorsi'
  ],
  secondaryMuscles: [
    'Biceps Brachii',
    'Posterior Deltoids',
    'Brachialis'
  ],
  description: 'Strict upper back hypertrophy builder eliminating lower-back axial fatigue by stabilizing torso against an angled pad.',
  setupInstructions: [
    'Set seat/chest pad height so top of chest pad rests right at sternum level.',
    'Sit or lie facing the pad with feet planted firmly on footrests or floor.',
    'Reach forward and take a neutral or pronated grip on the handles.'
  ],
  executionInstructions: [
    'Pull handles towards your ribs, driving elbows behind your torso.',
    'Retract and squeeze your scapulae forcefully together at peak contraction.',
    'Extend arms forward under control to achieve a deep upper back stretch.'
  ],
  formCues: [
    'Keep chest glued to the pad throughout the full repetition.',
    'Drive elbows back rather than curling with your wrists.'
  ],
  commonMistakes: [
    'Peeling chest off the pad to heave the weight back.',
    'Shrugging shoulders into ears at contraction.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/H75im9fAUMc?rel=0&modestbranding=1',
  videoSourceTitle: 'Chest-Supported Row Form Guide',
  workoutGuideSlug: 'chest-supported-row',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/7vG5o25.gif'
},
  {
  id: 'reverse-pec-deck',
  name: 'Reverse Pec Deck',
  category: 'Shoulders',
  equipment: 'Machine',
  defaultRestSeconds: 60,
  difficulty: 'Beginner',
  targetMuscles: [
    'Posterior Deltoids (Rear Delts)'
  ],
  secondaryMuscles: [
    'Rhomboids',
    'Infraspinatus',
    'Mid Trapezius'
  ],
  description: 'Dedicated rear delt machine isolation that enforces clean horizontal abduction without lower back recruitment.',
  setupInstructions: [
    'Adjust seat height so machine handles align level with shoulders.',
    'Sit facing the machine chest pad with feet flat on the floor.',
    'Grip horizontal or vertical handles with slight bend in elbows.'
  ],
  executionInstructions: [
    'Pull handles backward and outward in a wide arc until hands are in line with shoulders.',
    'Pause for 1 second squeezing rear deltoids tightly.',
    'Return to starting stretch position smoothly under tension.'
  ],
  formCues: [
    'Keep elbows fixed at a slight angle—no bending and unbending.',
    'Focus purely on the back of your shoulders driving the motion.'
  ],
  commonMistakes: [
    'Excessive scapular pinching which shifts work from rear delts to rhomboids.',
    'Using momentum to slam weights.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/5yMaNmP6nps?rel=0&modestbranding=1',
  videoSourceTitle: 'Reverse Pec Deck / Rear Delt Fly Guide',
  workoutGuideSlug: 'reverse-pec-deck',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/myfUsKf.gif'
},
  {
  id: 'dumbbell-bicep-curl',
  name: 'Dumbbell Biceps Curls',
  category: 'Arms',
  equipment: 'Dumbbell',
  defaultRestSeconds: 60,
  difficulty: 'Beginner',
  targetMuscles: [
    'Biceps Brachii (Short & Long Heads)'
  ],
  secondaryMuscles: [
    'Brachialis',
    'Brachioradialis',
    'Forearm Flexors'
  ],
  description: 'Fundamental unilateral arm builder with wrist supination for optimal biceps peak contraction and elbow flexion strength.',
  setupInstructions: [
    'Stand or sit tall holding a dumbbell in each hand at sides, palms facing in.',
    'Pull shoulders back, tuck core tight, and plant feet firmly.'
  ],
  executionInstructions: [
    'Curl dumbbells upward while rotating (supinating) wrists so palms face upward at chest height.',
    'Squeeze biceps hard at the peak for 1 second.',
    'Lower dumbbells back down under control with 2–3 second eccentric tempo.'
  ],
  formCues: [
    'Pin elbows beside your ribs—do not drift elbows forward.',
    'Control weights all the way down to full arm extension.'
  ],
  commonMistakes: [
    'Swinging hips or leaning back to hoist dumbbells.',
    'Allowing elbows to flare or drift forward.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/in7PaeYlJEQ?rel=0&modestbranding=1',
  videoSourceTitle: 'Dumbbell Bicep Curl Form Guide',
  workoutGuideSlug: 'bicep-curl',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/3s4NnTh.gif'
},
  {
  id: 'seated-leg-curl',
  name: 'Seated Leg Curl',
  category: 'Legs',
  equipment: 'Machine',
  defaultRestSeconds: 90,
  difficulty: 'Beginner',
  targetMuscles: [
    'Hamstrings (Biceps Femoris, Semitendinosus, Semimembranosus)'
  ],
  secondaryMuscles: [
    'Gastrocnemius (Calves)'
  ],
  description: 'Superior hamstring hypertrophy exercise utilizing knee flexion at hip flexion angle to train hamstrings at stretched muscle lengths.',
  setupInstructions: [
    'Adjust backrest so knees align directly with the machine pivot axis.',
    'Position lower leg pad just beneath calves and lock thigh clamp pad tightly above knees.',
    'Grip side handles firmly to anchor your hips into the seat.'
  ],
  executionInstructions: [
    'Flex knees pulling heels down and back underneath the seat.',
    'Hold contraction at the bottom for 1 full second.',
    'Slowly allow the pad to rise over 2–3 seconds until legs are extended.'
  ],
  formCues: [
    'Keep hips pushed deep into backrest—do not lift glutes.',
    'Dorsiflex toes slightly toward shins during the curl.'
  ],
  commonMistakes: [
    'Loose thigh pad allowing legs to lift during heavy weight.',
    'Letting weight crash down without eccentric control.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/ELOCsoDSmrg?rel=0&modestbranding=1',
  videoSourceTitle: 'Seated Leg Curl Form Tutorial',
  workoutGuideSlug: 'seated-leg-curl',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/Zg3XY7P.gif'
},
  {
  id: 'cable-crunches',
  name: 'Cable Crunches',
  category: 'Core',
  equipment: 'Cable',
  defaultRestSeconds: 60,
  difficulty: 'Intermediate',
  targetMuscles: [
    'Rectus Abdominis (Six-Pack Core)'
  ],
  secondaryMuscles: [
    'External Obliques',
    'Internal Obliques'
  ],
  description: 'High-tension spinal flexion exercise that progressively overloads abdominal muscles with adjustable cable resistance.',
  setupInstructions: [
    'Attach rope handle to high cable pulley.',
    'Kneel on a soft mat 2–3 feet facing away from or toward pulley stack.',
    'Hold rope handles beside ears/cheeks with elbows bent.'
  ],
  executionInstructions: [
    'Crunch down, curling spine to bring elbows toward thighs.',
    'Exhale and contract abdominals as tightly as possible at the bottom.',
    'Slowly uncurl and return to starting position keeping tension on abs.'
  ],
  formCues: [
    'Flex your spine—think about curling your ribcage toward your pelvis.',
    'Keep hips locked stationary; do not sit back on your calves.'
  ],
  commonMistakes: [
    'Bending at hips (hip flexion) rather than curling the spine (abdominal flexion).',
    'Pulling with arms and triceps rather than contracting core.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/2fOROqve63o?rel=0&modestbranding=1',
  videoSourceTitle: 'Cable Crunch Proper Form Guide',
  workoutGuideSlug: 'cable-crunch',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/CUmLRTA.gif'
},
{
  id: 'overhead-dumbbell-tricep-extension',
  name: 'Overhead Dumbbell Tricep Extension',
  category: 'Arms',
  equipment: 'Dumbbell',
  defaultRestSeconds: 90,
  difficulty: 'Intermediate',
  targetMuscles: ['Triceps Brachii (Long Head)'],
  secondaryMuscles: ['Medial & Lateral Triceps Heads', 'Core Stabilizers'],
  description: 'High-yield tricep exercise executed seated or standing with one or two hands, placing the long head of the tricep into maximum overhead stretch.',
  setupInstructions: [
    'Sit upright on a flat bench or stand with feet shoulder-width apart and core braced.',
    'Grip a dumbbell overhead cupping the underside of the top weight plate with both hands in a diamond grip (or holding a single dumbbell in one hand).',
    'Lock upper arms vertical and close to ears.'
  ],
  executionInstructions: [
    'Inhale and lower the dumbbell smoothly behind your head by bending at the elbows.',
    'Descend until forearms go past 90 degrees to achieve a full tricep stretch.',
    'Exhale and extend forearms back overhead to lockout, focusing on driving through triceps.'
  ],
  formCues: [
    'Keep elbows pinned inward rather than flaring wide.',
    'Keep ribcage down and avoid hyperextending the lower back.',
    'Control the lowering tempo for a deep 2-second stretch.'
  ],
  commonMistakes: [
    'Flaring elbows outward excessively, which shifts load to shoulder joints.',
    'Shortening range of motion without getting behind head.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/nRiJVZDpdL0?rel=0&modestbranding=1',
  videoSourceTitle: 'Overhead Dumbbell Tricep Extension Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/kont8Ut.gif'
},
{
  id: 'dumbbell-side-delt-rows',
  name: 'Dumbbell Side Delt Rows',
  category: 'Shoulders',
  equipment: 'Dumbbell',
  defaultRestSeconds: 75,
  difficulty: 'Intermediate',
  targetMuscles: ['Lateral Deltoids', 'Posterior Deltoids'],
  secondaryMuscles: ['Upper Trapezius', 'Rhomboids'],
  description: 'Bent-forward lateral row variation designed to maximally recruit lateral and rear delts without excessive upper trap dominance.',
  setupInstructions: [
    'Hinge forward at the hips to roughly a 30 to 45 degree torso angle with a flat back and soft knees.',
    'Hold a pair of dumbbells hanging in front of shins with palms facing inward or slightly back.'
  ],
  executionInstructions: [
    'Row the dumbbells out wide to the sides, leading with the elbows high and wide.',
    'Focus on pulling through the outer deltoids rather than squeezing shoulder blades together.',
    'Pause for a fraction of a second at peak abduction, then lower under control.'
  ],
  formCues: [
    'Lead with the elbows wide, forming an arch away from the ribs.',
    'Think of pouring water out of pitchers at the top.',
    'Keep the spine neutral and avoid using torso momentum.'
  ],
  commonMistakes: [
    'Turning it into a standard lat row with elbows tucked tight to torso.',
    'Using body momentum to jerk the dumbbells upward.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/3VcKaXpzqRo?rel=0&modestbranding=1',
  videoSourceTitle: 'Side Delt Row Form Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/ainizkb.gif'
},
{
  id: 'dumbbell-romanian-deadlift',
  name: 'Dumbbell Romanian Deadlift',
  category: 'Legs',
  equipment: 'Dumbbell',
  defaultRestSeconds: 90,
  difficulty: 'Intermediate',
  targetMuscles: ['Hamstrings', 'Gluteus Maximus'],
  secondaryMuscles: ['Erector Spinae', 'Forearms / Grip'],
  description: 'Posterior chain pure hinge movement with dumbbells kept close to thighs, emphasizing loaded hamstring stretch and glute hypertrophy.',
  setupInstructions: [
    'Stand upright holding a dumbbell in each hand in front of your thighs with an overhand grip.',
    'Feet hip-width apart, knees slightly unlocked, core and lats engaged.'
  ],
  executionInstructions: [
    'Push your hips backward as if trying to touch the wall behind you.',
    'Glide the dumbbells straight down along your shins while maintaining a flat back.',
    'Descend until you feel a deep hamstring stretch (just below knee height).',
    'Drive hips forward and contract glutes at the top to return to standing.'
  ],
  formCues: [
    'Push hips back horizontally; do not squat down with knees.',
    'Keep dumbbells scraping close to legs the entire rep.',
    'Maintain neutral neck and spine throughout.'
  ],
  commonMistakes: [
    'Rounding the lower back during the descent.',
    'Bending the knees excessively into a squat.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/jEy_czb3RKA?rel=0&modestbranding=1',
  videoSourceTitle: 'Dumbbell RDL Proper Form Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/rR0LJzx.gif'
},
{
  id: 'dumbbell-shrugs',
  name: 'Dumbbell Shrugs',
  category: 'Back',
  equipment: 'Dumbbell',
  defaultRestSeconds: 75,
  difficulty: 'Beginner',
  targetMuscles: ['Upper Trapezius'],
  secondaryMuscles: ['Levator Scapulae', 'Forearm Flexors'],
  description: 'Direct upper trapezius isolation exercise elevating heavy dumbbells vertically to build thick neck and upper back musculature.',
  setupInstructions: [
    'Stand upright with feet hip-width apart, holding a heavy dumbbell in each hand at your sides.',
    'Arms straight with palms facing inward, shoulders retracted and chest tall.'
  ],
  executionInstructions: [
    'Elevate your shoulders straight up toward your ears in a strict vertical line.',
    'Pause and squeeze the traps hard at peak contraction for 1 to 2 seconds.',
    'Lower the dumbbells slowly to feel a deep trapezius stretch at the bottom.'
  ],
  formCues: [
    'Elevate straight up and down; never roll shoulders backward or forward.',
    'Keep arms straight without bending at the elbows.',
    'Use a full stretch at the bottom of every rep.'
  ],
  commonMistakes: [
    'Rolling shoulders in circles (grinds rotator cuff and AC joint).',
    'Bending elbows to cheat weight upward.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/g6qbq4Lf1FI?rel=0&modestbranding=1',
  videoSourceTitle: 'Dumbbell Shrugs Form Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/NJzBsGJ.gif'
},
{
  id: 'dumbbell-bench-dips',
  name: 'Dumbbell Bench Dips',
  category: 'Arms',
  equipment: 'Dumbbell',
  defaultRestSeconds: 90,
  difficulty: 'Intermediate',
  targetMuscles: ['Triceps Brachii'],
  secondaryMuscles: ['Anterior Deltoids', 'Pectoralis Major (Lower)'],
  description: 'Bench dips targeting all three heads of the triceps, with an optional dumbbell placed across the lap for progressive overload.',
  setupInstructions: [
    'Sit on the edge of a flat bench with hands gripping the bench edge next to hips, fingers forward.',
    'Extend legs forward with heels on the floor (or elevated on a second bench for added difficulty).',
    'Optionally place a dumbbell securely flat across thighs/lap for added resistance.'
  ],
  executionInstructions: [
    'Slide hips slightly off the edge of the bench with arms supporting your weight.',
    'Inhale and lower hips vertically by bending elbows until upper arms are parallel to the floor.',
    'Exhale and press firmly into the bench through your palms to return to full elbow extension.'
  ],
  formCues: [
    'Keep back close to the bench as you descend.',
    'Keep shoulders depressed down away from ears.',
    'Do not descend below 90 degrees at the elbow to protect the shoulder capsule.'
  ],
  commonMistakes: [
    'Drifting hips too far away from the bench, stressing anterior shoulder ligaments.',
    'Shrugging shoulders into ears during the press.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/0326dy_-CzM?rel=0&modestbranding=1',
  videoSourceTitle: 'Bench Dips Form Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/9RT8oQW.gif'
},
{
  id: 'overhead-dumbbell-press',
  name: 'Overhead Dumbbell Press (Seated/Standing)',
  category: 'Shoulders',
  equipment: 'Dumbbell',
  defaultRestSeconds: 90,
  difficulty: 'Intermediate',
  targetMuscles: ['Anterior Deltoids', 'Lateral Deltoids'],
  secondaryMuscles: ['Triceps Brachii', 'Upper Trapezius', 'Core'],
  description: 'The foundational vertical shoulder pressing movement with dumbbells for rounded deltoid development and overhead pushing power.',
  setupInstructions: [
    'Sit upright on a flat or 85-degree bench, or stand with feet shoulder-width apart.',
    'Kick dumbbells up to shoulder height with palms facing forward or slightly angled inward (scapular plane).'
  ],
  executionInstructions: [
    'Brace core and press dumbbells overhead in a smooth upward arc.',
    'Lock out arms with dumbbells aligned directly over shoulders and crown of head.',
    'Lower weights under control back to ear level before initiating the next rep.'
  ],
  formCues: [
    'Press in the natural scapular plane (elbows angled slightly forward at 30 degrees).',
    'Lock glutes and abs to avoid hyperextending lumbar spine.',
    'Full controlled stretch at the bottom; do not bounce.'
  ],
  commonMistakes: [
    'Arching lower back excessively to turn the exercise into an incline chest press.',
    'Flaring elbows 90 degrees out to the sides.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/qEwKCR5JCog?rel=0&modestbranding=1',
  videoSourceTitle: 'Dumbbell Shoulder Press Form Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/A6wtbuL.gif'
},
{
  id: 'dumbbell-pullover',
  name: 'Dumbbell Pullovers',
  category: 'Back',
  equipment: 'Dumbbell',
  defaultRestSeconds: 90,
  difficulty: 'Intermediate',
  targetMuscles: ['Latissimus Dorsi', 'Serratus Anterior'],
  secondaryMuscles: ['Pectoralis Major (Sternal)', 'Triceps (Long Head)'],
  description: 'Premier home/indoor lat and serratus exercise performing a sweeping overhead arc across a flat bench, serving as a powerful alternative to pull-ups.',
  setupInstructions: [
    'Lie perpendicular across a flat bench with upper back and shoulders supported, hips slightly lowered.',
    'Cup the top plate of a dumbbell with both hands directly above your chest with arms extended and a slight micro-bend in elbows.'
  ],
  executionInstructions: [
    'Inhale deeply and lower the dumbbell in an arc backward behind your head.',
    'Descend until arms are parallel with torso or you feel an intense stretch through lats and ribcage.',
    'Exhale and pull the dumbbell back over chest using your lats, maintaining fixed elbow bend.'
  ],
  formCues: [
    'Keep elbow angle fixed throughout the movement; do not turn it into a tricep skull crusher.',
    'Lower hips slightly as the dumbbell goes back to increase the lat stretch.',
    'Squeeze lats hard at top of the movement.'
  ],
  commonMistakes: [
    'Bending and straightening elbows excessively during the rep.',
    'Hyperextending spine or lifting hips violently.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/5Y2dBXj5VoE?rel=0&modestbranding=1',
  videoSourceTitle: 'Dumbbell Pullover Form Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/9XjtHvS.gif'
},
{
  id: 'dumbbell-chest-flyes',
  name: 'Dumbbell Chest Flyes',
  category: 'Chest',
  equipment: 'Dumbbell',
  defaultRestSeconds: 75,
  difficulty: 'Intermediate',
  targetMuscles: ['Pectoralis Major (Sternal & Clavicular)'],
  secondaryMuscles: ['Anterior Deltoids', 'Biceps Brachii (Short Head)'],
  description: 'Horizontal chest isolation movement opening the chest wide on a flat bench to generate peak eccentric muscle fiber tension.',
  setupInstructions: [
    'Lie flat on a bench holding dumbbells directly above chest with palms facing each other.',
    'Slight bend in elbows (approx 15 degrees) that stays locked throughout the set.',
    'Feet firmly planted and scapulae retracted into the bench.'
  ],
  executionInstructions: [
    'Inhale and lower dumbbells out to sides in a wide arc until chest is fully stretched.',
    'Descend until dumbbells are level with torso or armpits.',
    'Exhale and bring dumbbells back up following the same arc, imagining hugging a giant barrel.'
  ],
  formCues: [
    'Keep the slight elbow bend rigid and consistent like embracing a tree trunk.',
    'Squeeze inner chest together at the apex of the rep.',
    'Stop descent when you feel a comfortable stretch without joint pain.'
  ],
  commonMistakes: [
    'Turning the flye into a dumbbell press by bending elbows to 90 degrees.',
    'Over-stretching deep past shoulder joint tolerance.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/eozdVDA78K0?rel=0&modestbranding=1',
  videoSourceTitle: 'Dumbbell Flyes Form Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/yz9nUhF.gif'
},
// --- NEW EXERCISES & MULTI-EQUIPMENT VARIATIONS ---
{
  id: 'barbell-wrist-curl',
  name: 'Barbell Wrist Curl',
  category: 'Arms',
  equipment: 'Barbell',
  defaultRestSeconds: 60,
  difficulty: 'Beginner',
  targetMuscles: ['Forearm Flexors (Flexor Carpi Radialis & Ulnaris)'],
  secondaryMuscles: ['Brachioradialis', 'Finger Flexors (Grip Strength)'],
  description: 'Foundational forearm isolation exercise building wrist flexion power, dense lower-arm mass, and impenetrable grip strength.',
  setupInstructions: [
    'Sit on a flat bench holding a barbell with an underhand (palms up) grip roughly shoulder-width apart.',
    'Rest your forearms flat against your thighs or across the bench with wrists hanging just over the edge.'
  ],
  executionInstructions: [
    'Inhale and lower the barbell by extending wrists downward as far as comfortable.',
    'Optionally let the bar roll into your fingers slightly for an increased stretch.',
    'Exhale and curl your wrists upward as high as possible, contracting forearms intensely for 1 second.'
  ],
  formCues: [
    'Keep forearms glued flat to the bench or thighs; isolate movement solely to the wrists.',
    'Perform smooth, controlled reps without jerky swinging.',
    'Squeeze forearm flexors hard at the top of every rep.'
  ],
  commonMistakes: [
    'Lifting forearms off the bench during the curl.',
    'Using excessively heavy weight that restricts full wrist flexion range.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/pCqJ7b3eR3A?rel=0&modestbranding=1',
  videoSourceTitle: 'Barbell Wrist Curl Form Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/6kSxYnw.gif'
},
{
  id: 'dumbbell-wrist-curl',
  name: 'Dumbbell Wrist Curl',
  category: 'Arms',
  equipment: 'Dumbbell',
  defaultRestSeconds: 60,
  difficulty: 'Beginner',
  targetMuscles: ['Forearm Flexors'],
  secondaryMuscles: ['Brachioradialis', 'Grip Stabilizers'],
  description: 'Unilateral or bilateral dumbbell wrist flexion allowing wrists to articulate along their natural biomechanical angle to eliminate joint strain.',
  setupInstructions: [
    'Sit on a bench holding dumbbells with an underhand grip (palms up).',
    'Rest forearms on thighs or over the bench edge with wrists free to flex and extend.'
  ],
  executionInstructions: [
    'Lower the dumbbells slowly by uncurling the wrists until a deep stretch is achieved.',
    'Curl the dumbbells upward through pure wrist flexion toward your body.',
    'Hold the peak contraction for a solid second before descending slowly.'
  ],
  formCues: [
    'Keep thumbs wrapped securely around the dumbbell handles.',
    'Maintain a steady 2-second eccentric cadence on the descent.'
  ],
  commonMistakes: [
    'Bouncing the weight at the bottom of the stretch.',
    'Relying on biceps momentum rather than wrist articulation.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/V8f6aQ6z4k8?rel=0&modestbranding=1',
  videoSourceTitle: 'Dumbbell Wrist Curl Technique',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/2dImyQ8.gif'
},
{
  id: 'barbell-reverse-wrist-curl',
  name: 'Barbell Reverse Wrist Curl',
  category: 'Arms',
  equipment: 'Barbell',
  defaultRestSeconds: 60,
  difficulty: 'Beginner',
  targetMuscles: ['Forearm Extensors (Extensor Carpi Radialis & Ulnaris)'],
  secondaryMuscles: ['Brachioradialis'],
  description: 'Overhand grip wrist extension isolating the forearm extensor bundle along the top of the arm to bulletproof the wrists and elbows.',
  setupInstructions: [
    'Kneel or sit next to a flat bench holding a barbell with an overhand (palms down) grip.',
    'Rest forearms across the bench with wrists hanging over the opposite edge.'
  ],
  executionInstructions: [
    'Lower the barbell toward the floor by flexing your wrists downward under control.',
    'Exhale and extend your wrists upward, raising the knuckles toward the ceiling.',
    'Squeeze the top of the forearms hard at peak contraction before lowering smoothly.'
  ],
  formCues: [
    'Keep your thumbs over the bar (thumbless grip) or wrapped securely as comfortable.',
    'Use lighter weight than standard wrist curls; extensors are smaller and fatigue quickly.'
  ],
  commonMistakes: [
    'Using too much weight and cutting range of motion.',
    'Allowing elbows to lift off the bench.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/sL6h3TfC79E?rel=0&modestbranding=1',
  videoSourceTitle: 'Reverse Barbell Wrist Curl Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/LsZkfU6.gif'
},
{
  id: 'dumbbell-reverse-wrist-curl',
  name: 'Dumbbell Reverse Wrist Curl',
  category: 'Arms',
  equipment: 'Dumbbell',
  defaultRestSeconds: 60,
  difficulty: 'Beginner',
  targetMuscles: ['Forearm Extensors'],
  secondaryMuscles: ['Brachioradialis', 'Extensor Digitorum'],
  description: 'Dumbbell reverse wrist curl allowing each forearm to work independently, fixing muscular size and strength asymmetries across the wrist joint.',
  setupInstructions: [
    'Rest forearms on thighs or a bench holding dumbbells with an overhand palms-down grip.',
    'Keep wrists extended slightly beyond the knee or bench edge.'
  ],
  executionInstructions: [
    'Lower the dumbbells downward until you feel a deep stretch in the forearm extensors.',
    'Lift your knuckles upward toward your shins/knees in a controlled curling motion.',
    'Pause for 1 second at full extension and return slowly.'
  ],
  formCues: [
    'Keep forearms horizontal and stationary.',
    'Emphasize full range of motion over heavy weight.'
  ],
  commonMistakes: [
    'Jerking dumbbells up using shoulder or elbow movement.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/rVwA6m5GfLw?rel=0&modestbranding=1',
  videoSourceTitle: 'Dumbbell Reverse Wrist Curl Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/BLCvwr2.gif'
},
{
  id: 'machine-chest-press',
  name: 'Machine Chest Press',
  category: 'Chest',
  equipment: 'Machine',
  defaultRestSeconds: 90,
  difficulty: 'Beginner',
  targetMuscles: ['Pectoralis Major (Mid & Lower)'],
  secondaryMuscles: ['Anterior Deltoids', 'Triceps Brachii'],
  description: 'Guided horizontal chest pressing machine offering exceptional joint stability, allowing lifters to train close to muscular failure safely.',
  setupInstructions: [
    'Adjust seat height so handles are aligned directly with mid-chest / nipple line.',
    'Plant feet firmly flat on the floor and retract shoulder blades against the backrest.'
  ],
  executionInstructions: [
    'Grip handles firmly and press forward until elbows are almost fully locked out without shrugging shoulders.',
    'Pause briefly at peak contraction to squeeze inner and mid-chest.',
    'Inhale and control the eccentric return until handles reach chest level with a comfortable stretch.'
  ],
  formCues: [
    'Keep chest proud and shoulder blades depressed against the pad throughout.',
    'Do not let the weight stack touch down between reps to preserve continuous tension.'
  ],
  commonMistakes: [
    'Setting seat too high or too low, stressing the shoulder capsule.',
    'Allowing shoulders to roll forward at the end of the press.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/sqOw2Y68ecY?rel=0&modestbranding=1',
  videoSourceTitle: 'Machine Chest Press Form Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/DOoWcnA.gif'
},
{
  id: 'incline-barbell-bench-press',
  name: 'Incline Barbell Bench Press',
  category: 'Chest',
  equipment: 'Barbell',
  defaultRestSeconds: 120,
  difficulty: 'Intermediate',
  targetMuscles: ['Pectoralis Major (Clavicular Head / Upper Chest)'],
  secondaryMuscles: ['Anterior Deltoids', 'Triceps Brachii'],
  description: 'Premier compound barbell movement on a 30-degree incline bench targeting upper pectoral thickness and overhead pushing foundation.',
  setupInstructions: [
    'Lie back on an incline bench (30 degrees optimal). Eyes directly under the racked barbell.',
    'Plant feet firmly and grip the bar slightly wider than shoulder-width with wrists straight.'
  ],
  executionInstructions: [
    'Unrack bar and stabilize it directly over clavicles with locked elbows.',
    'Inhale and lower bar under control to the upper chest / clavicular notch.',
    'Touch upper chest softly, then drive explosively upward back over shoulder joints.'
  ],
  formCues: [
    'Tuck elbows roughly 45 degrees; do not flare perpendicular to torso.',
    'Maintain arch in mid-back with shoulder blades retracted.'
  ],
  commonMistakes: [
    'Setting bench angle too steep (>45 degrees), which shifts load to front delts.',
    'Bouncing the barbell off the collarbone.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/SrqOu55lrYU?rel=0&modestbranding=1',
  videoSourceTitle: 'Incline Barbell Bench Press Form',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/3TZduzM.gif'
},
{
  id: 'overhead-cable-tricep-extension',
  name: 'Overhead Cable Triceps Extension',
  category: 'Arms',
  equipment: 'Cable',
  defaultRestSeconds: 90,
  difficulty: 'Intermediate',
  targetMuscles: ['Triceps Brachii (Long Head)'],
  secondaryMuscles: ['Lateral & Medial Triceps Heads'],
  description: 'Rope cable overhead triceps extension placing the long head into maximum stretch under constant cable tension across the full range of motion.',
  setupInstructions: [
    'Set cable pulley at head height or bottom with a rope attachment.',
    'Face away from cable tower, hold rope overhead with neutral grip, and step forward into a staggered stance with torso slightly angled forward.'
  ],
  executionInstructions: [
    'Keep upper arms locked in place beside ears with elbows bent deep behind head.',
    'Exhale and extend forearms forward and overhead, flaring the rope handles apart at peak lockout.',
    'Inhale and slowly return rope behind head for a full 2-second deep tricep stretch.'
  ],
  formCues: [
    'Pin elbows stationary; do not let elbows flare wide or shift forward and back.',
    'Flare rope outwards at top lockout for peak long-head recruitment.'
  ],
  commonMistakes: [
    'Turning the movement into a chest press by leaning forward excessively.',
    'Using torso momentum to jerk the rope.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/_gsUck-7M74?rel=0&modestbranding=1',
  videoSourceTitle: 'Cable Overhead Tricep Extension Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/2IxROQ1.gif'
},
{
  id: 'cable-rope-hammer-curl',
  name: 'Cable Rope Hammer Curl',
  category: 'Arms',
  equipment: 'Cable',
  defaultRestSeconds: 75,
  difficulty: 'Beginner',
  targetMuscles: ['Brachialis', 'Brachioradialis'],
  secondaryMuscles: ['Biceps Brachii', 'Forearms'],
  description: 'Neutral-grip cable curl utilizing rope attachment to deliver relentless continuous tension to the brachialis, pushing the biceps outward for arm width.',
  setupInstructions: [
    'Attach a rope to the lowest pulley setting of a cable station.',
    'Stand upright holding rope handles with thumbs facing upward (neutral grip), elbows tucked close to ribs.'
  ],
  executionInstructions: [
    'Curl the rope upward towards shoulders keeping palms facing each other throughout.',
    'At top of the curl, flare hands slightly outward and squeeze brachialis and forearms intensely.',
    'Lower weight slowly under constant cable resistance until arms are fully extended.'
  ],
  formCues: [
    'Keep elbows glued to sides; do not let them drift forward.',
    'Stand tall with core braced and avoid swinging torso.'
  ],
  commonMistakes: [
    'Leaning back to cheat weight up.',
    'Letting wrists bend backwards.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/zC3nLlEvin4?rel=0&modestbranding=1',
  videoSourceTitle: 'Cable Rope Hammer Curl Form',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/HPlPoQA.gif'
},
{
  id: 'barbell-reverse-curl',
  name: 'Barbell Reverse Curl',
  category: 'Arms',
  equipment: 'Barbell',
  defaultRestSeconds: 75,
  difficulty: 'Intermediate',
  targetMuscles: ['Brachioradialis', 'Brachialis'],
  secondaryMuscles: ['Forearm Extensors', 'Biceps Brachii'],
  description: 'Overhand grip barbell curl loading the brachioradialis muscle on the forearm and the brachialis beneath the biceps to build thick arms.',
  setupInstructions: [
    'Stand upright holding a straight barbell or EZ-bar with an overhand (pronated) grip shoulder-width apart.',
    'Elbows pinned to sides with shoulders depressed and core braced.'
  ],
  executionInstructions: [
    'Exhale and curl the bar upward in a smooth arc keeping knuckles aligned with forearms.',
    'Raise until forearms are near vertical, feeling intense contraction in the outer forearms.',
    'Lower bar slowly over 2–3 seconds back to thighs.'
  ],
  formCues: [
    'Keep wrists straight and firm; do not let wrists collapse downward.',
    'Keep elbows fixed at sides throughout.'
  ],
  commonMistakes: [
    'Allowing wrists to buckle under load.',
    'Using momentum or swinging hips to lift the bar.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/nRgxYX2Ve9w?rel=0&modestbranding=1',
  videoSourceTitle: 'Barbell Reverse Curl Technique',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/4LIG9xr.gif'
},
{
  id: 'cable-bicep-curl',
  name: 'Cable Bicep Curl',
  category: 'Arms',
  equipment: 'Cable',
  defaultRestSeconds: 75,
  difficulty: 'Beginner',
  targetMuscles: ['Biceps Brachii (Short & Long Heads)'],
  secondaryMuscles: ['Brachialis', 'Forearms'],
  description: 'Standing straight-bar or revolving-handle cable curl providing uninterrupted resistance curve throughout the entire biceps contraction arc.',
  setupInstructions: [
    'Attach a straight bar or EZ-attachment to a low cable pulley.',
    'Grip bar with an underhand (supinated) grip shoulder-width apart, stand tall with elbows pinned to sides.'
  ],
  executionInstructions: [
    'Exhale and curl the bar up toward upper chest while keeping upper arms strictly vertical.',
    'Squeeze biceps with maximum intensity at the top.',
    'Inhale and lower under control feeling tension right to the bottom lockout.'
  ],
  formCues: [
    'Maintain vertical upper arm posture throughout.',
    'Do not let shoulders roll forward or elbows hike up.'
  ],
  commonMistakes: [
    'Swinging the torso backward to initiate the curl.',
    'Letting elbows drift forward, turning the curl into a front raise.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/NFzTWp2qpiE?rel=0&modestbranding=1',
  videoSourceTitle: 'Standing Cable Bicep Curl Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/8oYqOt9.gif'
},
{
  id: 'machine-seated-calf-raise',
  name: 'Machine Seated Calf Raise',
  category: 'Legs',
  equipment: 'Machine',
  defaultRestSeconds: 60,
  difficulty: 'Beginner',
  targetMuscles: ['Soleus'],
  secondaryMuscles: ['Gastrocnemius', 'Achilles Tendon'],
  description: 'Seated calf machine with knees bent at 90 degrees to mechanically deactivate the gastrocnemius and selectively isolate the deep soleus muscle.',
  setupInstructions: [
    'Sit on the machine with balls of feet on lower platform and knees comfortably wedged under thigh pads.',
    'Release safety latch and let heels lower into a deep calf stretch.'
  ],
  executionInstructions: [
    'Press through the balls of feet to drive heels as high as possible into peak plantarflexion.',
    'Hold the peak contraction for 1 to 2 seconds at the top.',
    'Lower heels slowly into a deep stretch at the bottom for a full 2-second pause.'
  ],
  formCues: [
    'Never bounce reps out of the bottom stretch; pause to eliminate Achilles tendon reflex.',
    'Push through big toes and balls of feet evenly.'
  ],
  commonMistakes: [
    'Rapid bouncing with heavy weight without reaching full stretch or lockout.',
    'Setting knee pads too loose so legs shift during the lift.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/JbyjNymZOt0?rel=0&modestbranding=1',
  videoSourceTitle: 'Seated Calf Raise Form Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/bOOdeyc.gif'
},
{
  id: 'dumbbell-standing-calf-raise',
  name: 'Dumbbell Standing Calf Raise',
  category: 'Legs',
  equipment: 'Dumbbell',
  defaultRestSeconds: 60,
  difficulty: 'Beginner',
  targetMuscles: ['Gastrocnemius (Medial & Lateral Heads)'],
  secondaryMuscles: ['Soleus', 'Tibialis Posterior'],
  description: 'Standing calf exercise performed with dumbbells on an elevated block or step to load the upper calf through an exaggerated range of motion.',
  setupInstructions: [
    'Hold a dumbbell in one or both hands, standing with balls of feet on an elevated step or weight plate.',
    'Heels hanging freely off the edge, knees straight but not hyperextended.'
  ],
  executionInstructions: [
    'Lower heels down until you feel an intense stretch through calves and Achilles tendon.',
    'Drive balls of feet forcefully into the step to lift heels as high as possible.',
    'Contract calves hard at the apex for 1 second, then lower slowly.'
  ],
  formCues: [
    'Keep knees straight to maximize gastrocnemius recruitment.',
    'Pause 2 seconds at the bottom stretch before pushing up.'
  ],
  commonMistakes: [
    'Bending knees to bounce up.',
    'Rushing through reps without full extension.'
  ],
  videoEmbedUrl: 'https://www.youtube-nocookie.com/embed/-M4-G8p8fmc?rel=0&modestbranding=1',
  videoSourceTitle: 'Dumbbell Standing Calf Raise Guide',
  exerciseDbGifUrl: 'https://static.exercisedb.dev/media/dPmaUaU.gif'
}
];
