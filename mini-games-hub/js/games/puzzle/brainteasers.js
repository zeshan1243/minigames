// ─── Brain Teasers: Visual Word Puzzles (Dingbats) ───
// Words arranged visually to represent phrases/idioms
// e.g., SECRET (circled on top) + SECRET + SECRET = "TOP SECRET"

const PUZZLES = [
    // ═══ EASY (1-35) ═══
    { answer: 'TOP SECRET', options: ['Top Secret', 'Three Secrets', 'Secret Agent', 'Hidden Message'],
      draw: [
        { t:'text', text:'SECRET', x:.5, y:.2, size:36, bold:true },
        { t:'ellipse', cx:.5, cy:.2, rx:.28, ry:.09 },
        { t:'text', text:'SECRET', x:.5, y:.5, size:36, bold:true },
        { t:'text', text:'SECRET', x:.5, y:.8, size:36, bold:true }
    ]},
    { answer: 'I UNDERSTAND', options: ['I Understand', 'Standing Tall', 'Last Stand', 'Stand Alone'],
      draw: [
        { t:'text', text:'STAND', x:.5, y:.35, size:44, bold:true },
        { t:'text', text:'I', x:.5, y:.7, size:44, bold:true }
    ]},
    { answer: 'MIND OVER MATTER', options: ['Mind Over Matter', 'Brain Power', 'Mental Block', 'Grey Matter'],
      draw: [
        { t:'text', text:'MIND', x:.5, y:.3, size:44, bold:true },
        { t:'line', x1:.2, y1:.5, x2:.8, y2:.5, width:2 },
        { t:'text', text:'MATTER', x:.5, y:.7, size:44, bold:true }
    ]},
    { answer: 'TRICYCLE', options: ['Tricycle', 'Bicycle', 'Recycle', 'Unicycle'],
      draw: [
        { t:'text', text:'CYCLE', x:.5, y:.25, size:34, bold:true },
        { t:'text', text:'CYCLE', x:.5, y:.5, size:34, bold:true },
        { t:'text', text:'CYCLE', x:.5, y:.75, size:34, bold:true }
    ]},
    { answer: 'READING BETWEEN THE LINES', options: ['Reading Between The Lines', 'Underline', 'Headline', 'Fine Print'],
      draw: [
        { t:'line', x1:.15, y1:.3, x2:.85, y2:.3, width:3 },
        { t:'text', text:'READING', x:.5, y:.52, size:38, bold:true },
        { t:'line', x1:.15, y1:.7, x2:.85, y2:.7, width:3 }
    ]},
    { answer: 'BANANA SPLIT', options: ['Banana Split', 'Banana Peel', 'Banana Bread', 'Split Decision'],
      draw: [
        { t:'text', text:'BAN', x:.25, y:.5, size:44, bold:true },
        { t:'text', text:'ANA', x:.75, y:.5, size:44, bold:true }
    ]},
    { answer: 'JACK IN THE BOX', options: ['Jack In The Box', 'Music Box', 'Box Office', 'Pandora\'s Box'],
      draw: [
        { t:'rect', x:.25, y:.2, w:.5, h:.6, stroke:'#fff' },
        { t:'text', text:'JACK', x:.5, y:.52, size:40, bold:true }
    ]},
    { answer: 'LONG UNDERWEAR', options: ['Long Underwear', 'Outerwear', 'Nightwear', 'Underwear'],
      draw: [
        { t:'text', text:'WEAR', x:.5, y:.3, size:44, bold:true },
        { t:'text', text:'LONG', x:.5, y:.7, size:44, bold:true }
    ]},
    { answer: 'BACKWARD GLANCE', options: ['Backward Glance', 'Looking Back', 'Reverse Mirror', 'Rear View'],
      draw: [
        { t:'text', text:'ECNALG', x:.5, y:.5, size:48, bold:true }
    ]},
    { answer: 'CROSSROADS', options: ['Crossroads', 'Highway', 'Intersection', 'Dead End'],
      draw: [
        { t:'text', text:'ROAD', x:.5, y:.5, size:40, bold:true },
        { t:'text', text:'R\nO\nA\nD', x:.5, y:.5, size:28, bold:true, vertical:true }
    ]},
    { answer: 'HEAD OVER HEELS', options: ['Head Over Heels', 'Tripping Up', 'Heel Turn', 'Standing Ovation'],
      draw: [
        { t:'text', text:'HEAD', x:.5, y:.3, size:44, bold:true },
        { t:'line', x1:.2, y1:.5, x2:.8, y2:.5, width:2 },
        { t:'text', text:'HEELS', x:.5, y:.7, size:44, bold:true }
    ]},
    { answer: 'BROKEN PROMISE', options: ['Broken Promise', 'Empty Promise', 'Kept Promise', 'Promise Ring'],
      draw: [
        { t:'text', text:'PR', x:.2, y:.5, size:42, bold:true },
        { t:'text', text:'OM', x:.45, y:.42, size:42, bold:true },
        { t:'text', text:'ISE', x:.75, y:.55, size:42, bold:true }
    ]},
    { answer: 'THINK OUTSIDE THE BOX', options: ['Think Outside The Box', 'Jack In The Box', 'Box Clever', 'Inbox'],
      draw: [
        { t:'rect', x:.3, y:.3, w:.4, h:.4, stroke:'#fff' },
        { t:'text', text:'THINK', x:.12, y:.2, size:30, bold:true }
    ]},
    { answer: 'DOWNTOWN', options: ['Downtown', 'Uptown', 'Midtown', 'Old Town'],
      draw: [
        { t:'text', text:'T', x:.5, y:.15, size:36, bold:true },
        { t:'text', text:'O', x:.5, y:.3, size:36, bold:true },
        { t:'text', text:'W', x:.5, y:.45, size:36, bold:true },
        { t:'text', text:'N', x:.5, y:.6, size:36, bold:true },
        { t:'text', text:'↓', x:.5, y:.8, size:36 }
    ]},
    { answer: 'SPLIT SECOND', options: ['Split Second', 'Second Place', 'Second Wind', 'Second Nature'],
      draw: [
        { t:'text', text:'SEC', x:.25, y:.5, size:44, bold:true },
        { t:'text', text:'OND', x:.75, y:.5, size:44, bold:true }
    ]},
    { answer: 'RED HERRING', options: ['Red Herring', 'Red Alert', 'Seeing Red', 'Red Carpet'],
      draw: [
        { t:'text', text:'HERRING', x:.5, y:.5, size:44, bold:true, color:'#ff2d7b' }
    ]},
    { answer: 'DOUBLE CROSS', options: ['Double Cross', 'Crossbow', 'Angry Cross', 'Cross Stitch'],
      draw: [
        { t:'text', text:'✕', x:.35, y:.5, size:72, bold:true },
        { t:'text', text:'✕', x:.65, y:.5, size:72, bold:true }
    ]},
    { answer: 'ONCE UPON A TIME', options: ['Once Upon A Time', 'Time After Time', 'Overtime', 'Father Time'],
      draw: [
        { t:'text', text:'ONCE', x:.5, y:.15, size:30, bold:true },
        { t:'text', text:'A TIME', x:.5, y:.75, size:40, bold:true }
    ]},
    { answer: 'SMALL TALK', options: ['Small Talk', 'Big Talk', 'Pillow Talk', 'Talk Show'],
      draw: [
        { t:'text', text:'talk', x:.5, y:.5, size:14 }
    ]},
    { answer: 'BIG DEAL', options: ['Big Deal', 'New Deal', 'Deal Breaker', 'Card Deal'],
      draw: [
        { t:'text', text:'DEAL', x:.5, y:.5, size:72, bold:true }
    ]},
    { answer: 'GOLDEN AGE', options: ['Golden Age', 'Ice Age', 'Dark Age', 'Stone Age'],
      draw: [
        { t:'text', text:'AGE', x:.5, y:.5, size:56, bold:true, color:'#ffd60a' }
    ]},
    { answer: 'DOUBLE VISION', options: ['Double Vision', 'Night Vision', 'Tunnel Vision', 'Clear Vision'],
      draw: [
        { t:'text', text:'VISION', x:.48, y:.48, size:40, bold:true, opacity:.5 },
        { t:'text', text:'VISION', x:.52, y:.52, size:40, bold:true, opacity:.5 }
    ]},
    { answer: 'HALF TIME', options: ['Half Time', 'Full Time', 'Part Time', 'Over Time'],
      draw: [
        { t:'text', text:'TIME', x:.5, y:.5, size:56, bold:true, clipHalf:true }
    ]},
    { answer: 'RISING STAR', options: ['Rising Star', 'Falling Star', 'Rock Star', 'Star Sign'],
      draw: [
        { t:'text', text:'STAR', x:.5, y:.5, size:44, bold:true, rotate:-25 }
    ]},
    { answer: 'FALLING STAR', options: ['Falling Star', 'Rising Star', 'Star Wars', 'Bright Star'],
      draw: [
        { t:'text', text:'STAR', x:.5, y:.5, size:44, bold:true, rotate:25 }
    ]},
    { answer: 'UPSIDE DOWN CAKE', options: ['Upside Down Cake', 'Pancake', 'Cupcake', 'Layer Cake'],
      draw: [
        { t:'text', text:'CAKE', x:.5, y:.5, size:52, bold:true, flip:true }
    ]},
    { answer: 'SCRAMBLED EGGS', options: ['Scrambled Eggs', 'Fried Eggs', 'Boiled Eggs', 'Easter Eggs'],
      draw: [
        { t:'text', text:'SGEG', x:.35, y:.4, size:38, bold:true },
        { t:'text', text:'', x:.65, y:.6, size:38, bold:true }
    ]},
    { answer: 'NO U-TURN', options: ['No U-Turn', 'Detour', 'U-Turn', 'Wrong Turn'],
      draw: [
        { t:'text', text:'T_RN', x:.5, y:.5, size:56, bold:true },
        { t:'text', text:'(no U!)', x:.5, y:.75, size:16, color:'#ff2d7b' }
    ]},
    { answer: 'CIRCLE OF LIFE', options: ['Circle Of Life', 'Game Of Life', 'Life Line', 'Lifelong'],
      draw: [
        { t:'circle', cx:.5, cy:.5, r:.22 },
        { t:'text', text:'LIFE', x:.5, y:.53, size:30, bold:true }
    ]},
    { answer: 'SQUARE MEAL', options: ['Square Meal', 'Meal Deal', 'Happy Meal', 'Meal Plan'],
      draw: [
        { t:'rect', x:.25, y:.25, w:.5, h:.5, stroke:'#fff', fill:'rgba(255,255,255,0.03)' },
        { t:'text', text:'MEAL', x:.5, y:.53, size:36, bold:true }
    ]},
    { answer: 'SIDE BY SIDE', options: ['Side By Side', 'Sideways', 'Upside', 'Inside Out'],
      draw: [
        { t:'text', text:'SIDE', x:.3, y:.5, size:40, bold:true },
        { t:'text', text:'SIDE', x:.7, y:.5, size:40, bold:true }
    ]},
    { answer: 'WATER UNDER THE BRIDGE', options: ['Water Under The Bridge', 'Bridge Over Water', 'Troubled Water', 'Waterfall'],
      draw: [
        { t:'text', text:'BRIDGE', x:.5, y:.3, size:40, bold:true },
        { t:'line', x1:.15, y1:.48, x2:.85, y2:.48, width:3 },
        { t:'text', text:'WATER', x:.5, y:.7, size:36, bold:true }
    ]},
    { answer: 'HISTORY REPEATS ITSELF', options: ['History Repeats Itself', 'Ancient History', 'Making History', 'History Book'],
      draw: [
        { t:'text', text:'HISTORY', x:.5, y:.35, size:36, bold:true },
        { t:'text', text:'HISTORY', x:.5, y:.65, size:36, bold:true }
    ]},
    { answer: 'GROWING UP', options: ['Growing Up', 'Grown Up', 'Stand Up', 'Rise Up'],
      draw: [
        { t:'text', text:'UP', x:.4, y:.7, size:20, bold:true },
        { t:'text', text:'UP', x:.5, y:.5, size:36, bold:true },
        { t:'text', text:'UP', x:.6, y:.25, size:52, bold:true }
    ]},
    { answer: 'SEE THROUGH', options: ['See Through', 'Breakthrough', 'Look Through', 'Pass Through'],
      draw: [
        { t:'text', text:'THROUGH', x:.5, y:.5, size:42, bold:true, opacity:.2 }
    ]},

    // ═══ MEDIUM (36-70) ═══
    { answer: 'UNDERCOVER AGENT', options: ['Undercover Agent', 'Secret Agent', 'Double Agent', 'Travel Agent'],
      draw: [
        { t:'text', text:'COVER', x:.5, y:.35, size:40, bold:true },
        { t:'text', text:'AGENT', x:.5, y:.65, size:40, bold:true }
    ]},
    { answer: 'EGGS OVER EASY', options: ['Eggs Over Easy', 'Scrambled Eggs', 'Hard Boiled', 'Egg Timer'],
      draw: [
        { t:'text', text:'EGGS', x:.5, y:.3, size:44, bold:true },
        { t:'line', x1:.2, y1:.5, x2:.8, y2:.5, width:2 },
        { t:'text', text:'EASY', x:.5, y:.7, size:44, bold:true }
    ]},
    { answer: 'JUST BETWEEN US', options: ['Just Between Us', 'Between Jobs', 'Just In Case', 'Among Friends'],
      draw: [
        { t:'text', text:'U', x:.2, y:.5, size:48, bold:true },
        { t:'text', text:'JUST', x:.5, y:.5, size:32, bold:true },
        { t:'text', text:'S', x:.8, y:.5, size:48, bold:true }
    ]},
    { answer: 'OVERSEAS', options: ['Overseas', 'Undersea', 'Open Sea', 'Deep Sea'],
      draw: [
        { t:'text', text:'OVER', x:.5, y:.3, size:36, bold:true },
        { t:'text', text:'SEAS', x:.5, y:.65, size:44, bold:true }
    ]},
    { answer: 'MISSING LINK', options: ['Missing Link', 'Broken Link', 'Weak Link', 'Chain Link'],
      draw: [
        { t:'text', text:'LI_K', x:.5, y:.5, size:56, bold:true }
    ]},
    { answer: 'ONE IN A MILLION', options: ['One In A Million', 'First Place', 'Number One', 'Millionaire'],
      draw: [
        { t:'text', text:'M', x:.2, y:.5, size:40, bold:true },
        { t:'text', text:'I', x:.32, y:.5, size:40, bold:true },
        { t:'text', text:'L', x:.42, y:.5, size:40, bold:true },
        { t:'text', text:'L', x:.5, y:.5, size:40, bold:true, color:'#00d4ff' },
        { t:'text', text:'1', x:.5, y:.5, size:22, bold:true, color:'#ffd60a' },
        { t:'text', text:'O', x:.58, y:.5, size:40, bold:true },
        { t:'text', text:'N', x:.7, y:.5, size:40, bold:true }
    ]},
    { answer: 'BROKEN HEART', options: ['Broken Heart', 'Sweetheart', 'Heart Attack', 'Change Of Heart'],
      draw: [
        { t:'text', text:'HE', x:.3, y:.5, size:52, bold:true },
        { t:'text', text:'ART', x:.7, y:.5, size:52, bold:true }
    ]},
    { answer: 'BACK TO BACK', options: ['Back To Back', 'Setback', 'Feedback', 'Flashback'],
      draw: [
        { t:'text', text:'BACK', x:.3, y:.5, size:36, bold:true },
        { t:'text', text:'KCAB', x:.7, y:.5, size:36, bold:true }
    ]},
    { answer: 'CLOSE CALL', options: ['Close Call', 'Phone Call', 'Wake Up Call', 'Roll Call'],
      draw: [
        { t:'text', text:'CALL', x:.5, y:.5, size:44, bold:true, spacing:-6 }
    ]},
    { answer: 'WIDE RECEIVER', options: ['Wide Receiver', 'Narrow Escape', 'Open Arms', 'Wide Awake'],
      draw: [
        { t:'text', text:'R E C E I V E R', x:.5, y:.5, size:28, bold:true, spacing:8 }
    ]},
    { answer: 'TURNOVER', options: ['Turnover', 'Game Over', 'Leftover', 'Makeover'],
      draw: [
        { t:'text', text:'TURN', x:.5, y:.5, size:48, bold:true, flip:true }
    ]},
    { answer: 'STEPPING STONES', options: ['Stepping Stones', 'Milestone', 'Tombstone', 'Keystone'],
      draw: [
        { t:'text', text:'S', x:.15, y:.8, size:30, bold:true },
        { t:'text', text:'T', x:.25, y:.68, size:30, bold:true },
        { t:'text', text:'O', x:.38, y:.55, size:30, bold:true },
        { t:'text', text:'N', x:.5, y:.43, size:30, bold:true },
        { t:'text', text:'E', x:.63, y:.3, size:30, bold:true },
        { t:'text', text:'S', x:.78, y:.18, size:30, bold:true }
    ]},
    { answer: 'SPACE INVADERS', options: ['Space Invaders', 'Space Station', 'Outer Space', 'Deep Space'],
      draw: [
        { t:'text', text:'I  N  V  A  D  E  R  S', x:.5, y:.5, size:28, bold:true, spacing:6 }
    ]},
    { answer: 'ROUND TABLE', options: ['Round Table', 'Table Tennis', 'Turn Tables', 'Coffee Table'],
      draw: [
        { t:'circle', cx:.5, cy:.5, r:.22 },
        { t:'text', text:'TABLE', x:.5, y:.53, size:28, bold:true }
    ]},
    { answer: 'MIXED UP', options: ['Mixed Up', 'Grown Up', 'Made Up', 'Break Up'],
      draw: [
        { t:'text', text:'PU', x:.5, y:.5, size:56, bold:true }
    ]},
    { answer: 'FOREIGN LANGUAGE', options: ['Foreign Language', 'Body Language', 'Sign Language', 'Language Barrier'],
      draw: [
        { t:'text', text:'LANGUAGE', x:.5, y:.5, size:38, bold:true, flip:true }
    ]},
    { answer: 'TIME AFTER TIME', options: ['Time After Time', 'Half Time', 'Over Time', 'Time Out'],
      draw: [
        { t:'text', text:'TIME', x:.35, y:.5, size:42, bold:true },
        { t:'text', text:'TIME', x:.65, y:.5, size:42, bold:true }
    ]},
    { answer: 'MIDDLE AGE', options: ['Middle Age', 'Ice Age', 'Age Gap', 'Coming Of Age'],
      draw: [
        { t:'text', text:'A', x:.3, y:.5, size:44, bold:true },
        { t:'text', text:'MIDDLE', x:.5, y:.5, size:18, bold:true },
        { t:'text', text:'GE', x:.7, y:.5, size:44, bold:true }
    ]},
    { answer: 'CHECK UP', options: ['Check Up', 'Check In', 'Check Out', 'Rain Check'],
      draw: [
        { t:'text', text:'✓', x:.35, y:.5, size:52, color:'#00e676' },
        { t:'text', text:'UP', x:.6, y:.5, size:44, bold:true }
    ]},
    { answer: 'SANDBOX', options: ['Sandbox', 'Sandcastle', 'Sandstorm', 'Quicksand'],
      draw: [
        { t:'rect', x:.25, y:.25, w:.5, h:.5, stroke:'#fff' },
        { t:'text', text:'SAND', x:.5, y:.53, size:36, bold:true }
    ]},
    { answer: 'OUTLINE', options: ['Outline', 'Underline', 'Headline', 'Offline'],
      draw: [
        { t:'rect', x:.25, y:.3, w:.5, h:.35, stroke:'#fff' },
        { t:'text', text:'LINE', x:.5, y:.5, size:40, bold:true }
    ]},
    { answer: 'BOTTOM LINE', options: ['Bottom Line', 'Top Line', 'Finish Line', 'Fine Line'],
      draw: [
        { t:'text', text:'LINE', x:.5, y:.85, size:40, bold:true },
        { t:'line', x1:.2, y1:.78, x2:.8, y2:.78, width:2 }
    ]},
    { answer: 'EYE FOR AN EYE', options: ['Eye For An Eye', 'Bird\'s Eye', 'Eagle Eye', 'Evil Eye'],
      draw: [
        { t:'text', text:'👁️', x:.2, y:.5, size:48 },
        { t:'text', text:'4 AN', x:.5, y:.5, size:32, bold:true },
        { t:'text', text:'👁️', x:.8, y:.5, size:48 }
    ]},
    { answer: 'GREEN HOUSE', options: ['Green House', 'Greenhouse Effect', 'Penthouse', 'Treehouse'],
      draw: [
        { t:'text', text:'HOUSE', x:.5, y:.5, size:48, bold:true, color:'#00e676' }
    ]},
    { answer: 'DARK HORSE', options: ['Dark Horse', 'Seahorse', 'Horsepower', 'Horse Race'],
      draw: [
        { t:'rect', x:.15, y:.2, w:.7, h:.6, fill:'rgba(0,0,0,0.8)' },
        { t:'text', text:'HORSE', x:.5, y:.53, size:40, bold:true, color:'#333' }
    ]},

    // ═══ HARD (71-100) ═══
    { answer: 'PARADISE', options: ['Paradise', 'Dice Roll', 'Pair Of Socks', 'Paradise Lost'],
      draw: [
        { t:'text', text:'🎲🎲', x:.5, y:.4, size:52 },
        { t:'text', text:'PAIR A DICE', x:.5, y:.72, size:18, color:'#8888a0' }
    ]},
    { answer: 'SIX FEET UNDERGROUND', options: ['Six Feet Underground', 'Underworld', 'Six Pack', 'Six Sense'],
      draw: [
        { t:'text', text:'GROUND', x:.5, y:.3, size:36, bold:true },
        { t:'line', x1:.15, y1:.42, x2:.85, y2:.42, width:3 },
        { t:'text', text:'FEET FEET', x:.5, y:.58, size:24, bold:true },
        { t:'text', text:'FEET FEET', x:.5, y:.72, size:24, bold:true },
        { t:'text', text:'FEET FEET', x:.5, y:.86, size:24, bold:true }
    ]},
    { answer: 'FORGIVE AND FORGET', options: ['Forgive And Forget', 'Forget Me Not', 'Unforgettable', 'Forgetful'],
      draw: [
        { t:'text', text:'FOR GIVE', x:.5, y:.35, size:34, bold:true },
        { t:'text', text:'AND', x:.5, y:.5, size:20 },
        { t:'text', text:'FOR GET', x:.5, y:.65, size:34, bold:true }
    ]},
    { answer: 'UP IN ARMS', options: ['Up In Arms', 'Open Arms', 'Armed Forces', 'Army Base'],
      draw: [
        { t:'text', text:'A', x:.25, y:.3, size:36, bold:true },
        { t:'text', text:'R', x:.42, y:.3, size:36, bold:true },
        { t:'text', text:'UP', x:.5, y:.55, size:28, bold:true },
        { t:'text', text:'M', x:.58, y:.3, size:36, bold:true },
        { t:'text', text:'S', x:.75, y:.3, size:36, bold:true }
    ]},
    { answer: 'NEON LIGHTS', options: ['Neon Lights', 'Flashlight', 'Northern Lights', 'Limelight'],
      draw: [
        { t:'text', text:'KNEE', x:.35, y:.35, size:28, bold:true },
        { t:'text', text:'ON', x:.55, y:.45, size:20, bold:true, color:'#00d4ff' },
        { t:'text', text:'LIGHTS', x:.5, y:.7, size:36, bold:true }
    ]},
    { answer: 'OPEN SESAME', options: ['Open Sesame', 'Sesame Street', 'Open Door', 'Wide Open'],
      draw: [
        { t:'text', text:'SES', x:.3, y:.5, size:44, bold:true },
        { t:'text', text:'AME', x:.72, y:.5, size:44, bold:true }
    ]},
    { answer: 'OVERJOYED', options: ['Overjoyed', 'Joyful', 'Killjoy', 'Enjoy'],
      draw: [
        { t:'text', text:'OVER', x:.5, y:.3, size:28, bold:true },
        { t:'text', text:'JOYED', x:.5, y:.6, size:44, bold:true }
    ]},
    { answer: 'LOOK BOTH WAYS', options: ['Look Both Ways', 'Two Way Street', 'One Way', 'By The Way'],
      draw: [
        { t:'text', text:'←', x:.2, y:.5, size:36 },
        { t:'text', text:'LOOK', x:.5, y:.5, size:40, bold:true },
        { t:'text', text:'→', x:.8, y:.5, size:36 }
    ]},
    { answer: 'CORNERSTONE', options: ['Cornerstone', 'Milestone', 'Tombstone', 'Stepping Stone'],
      draw: [
        { t:'text', text:'STONE', x:.18, y:.18, size:32, bold:true }
    ]},
    { answer: 'LAST WORD', options: ['Last Word', 'First Word', 'Keyword', 'Crossword'],
      draw: [
        { t:'text', text:'word word word', x:.5, y:.3, size:20 },
        { t:'text', text:'word word word', x:.5, y:.5, size:20 },
        { t:'text', text:'word word WORD', x:.5, y:.7, size:20, bold:true }
    ]},
    { answer: 'SHRINKING VIOLET', options: ['Shrinking Violet', 'Ultra Violet', 'Violet Blue', 'African Violet'],
      draw: [
        { t:'text', text:'VIOLET', x:.5, y:.3, size:38, bold:true, color:'#b44dff' },
        { t:'text', text:'VIOLET', x:.5, y:.5, size:28, bold:true, color:'#b44dff' },
        { t:'text', text:'VIOLET', x:.5, y:.68, size:18, bold:true, color:'#b44dff' }
    ]},
    { answer: 'RIGHT ANGLE', options: ['Right Angle', 'Wide Angle', 'Angle Grinder', 'Triangle'],
      draw: [
        { t:'line', x1:.3, y1:.7, x2:.3, y2:.3, width:3 },
        { t:'line', x1:.3, y1:.7, x2:.7, y2:.7, width:3 },
        { t:'text', text:'RIGHT', x:.35, y:.62, size:20, bold:true }
    ]},
    { answer: 'HALF BAKED', options: ['Half Baked', 'Baked Alaska', 'Bakery', 'Double Baked'],
      draw: [
        { t:'text', text:'BAKED', x:.5, y:.5, size:50, bold:true, clipHalf:true }
    ]},
    { answer: 'TWO FACED', options: ['Two Faced', 'Facebook', 'Face Value', 'About Face'],
      draw: [
        { t:'text', text:'FACED', x:.35, y:.5, size:34, bold:true },
        { t:'text', text:'FACED', x:.65, y:.5, size:34, bold:true }
    ]},
    { answer: 'MAN OVERBOARD', options: ['Man Overboard', 'Board Game', 'Skateboard', 'Cardboard'],
      draw: [
        { t:'text', text:'BOARD', x:.5, y:.5, size:44, bold:true },
        { t:'text', text:'MAN', x:.75, y:.75, size:28, bold:true, rotate:30 }
    ]},
    { answer: 'GOOD AFTERNOON', options: ['Good Afternoon', 'Good Morning', 'Good Evening', 'Good Night'],
      draw: [
        { t:'text', text:'NOON', x:.5, y:.3, size:40, bold:true },
        { t:'text', text:'GOOD', x:.5, y:.65, size:40, bold:true }
    ]},
    { answer: 'PAINLESS OPERATION', options: ['Painless Operation', 'Major Operation', 'Covert Operation', 'Joint Operation'],
      draw: [
        { t:'text', text:'O_ER_T_O_', x:.5, y:.5, size:40, bold:true },
        { t:'text', text:'(no P,A,I,N)', x:.5, y:.75, size:14, color:'#ff2d7b' }
    ]},
    { answer: 'END OF THE LINE', options: ['End Of The Line', 'Bottom Line', 'Finish Line', 'Pick Up Line'],
      draw: [
        { t:'line', x1:.1, y1:.5, x2:.7, y2:.5, width:3 },
        { t:'text', text:'END', x:.82, y:.5, size:36, bold:true }
    ]},
    { answer: 'SCATTER BRAIN', options: ['Scatter Brain', 'Brain Freeze', 'Brainstorm', 'Brain Teaser'],
      draw: [
        { t:'text', text:'B', x:.2, y:.3, size:32, bold:true },
        { t:'text', text:'R', x:.6, y:.2, size:32, bold:true },
        { t:'text', text:'A', x:.35, y:.6, size:32, bold:true },
        { t:'text', text:'I', x:.75, y:.5, size:32, bold:true },
        { t:'text', text:'N', x:.5, y:.8, size:32, bold:true }
    ]},
    { answer: 'OUT OF ORDER', options: ['Out Of Order', 'Law And Order', 'Tall Order', 'Order Up'],
      draw: [
        { t:'text', text:'ODRRE', x:.5, y:.5, size:46, bold:true }
    ]},
    { answer: 'PIECING IT TOGETHER', options: ['Piecing It Together', 'Falling Apart', 'Jigsaw Puzzle', 'Patch Work'],
      draw: [
        { t:'text', text:'TO', x:.22, y:.4, size:30, bold:true },
        { t:'text', text:'GET', x:.5, y:.55, size:30, bold:true },
        { t:'text', text:'HER', x:.78, y:.4, size:30, bold:true }
    ]},
    { answer: 'CROSS MY HEART', options: ['Cross My Heart', 'Broken Heart', 'Heart Attack', 'Heart Of Gold'],
      draw: [
        { t:'text', text:'❤️', x:.5, y:.5, size:64 },
        { t:'text', text:'✕', x:.5, y:.48, size:80, color:'#fff' }
    ]},
    { answer: 'HEAD FIRST', options: ['Head First', 'Headband', 'Headline', 'Headcount'],
      draw: [
        { t:'text', text:'HEAD', x:.5, y:.15, size:44, bold:true },
        { t:'text', text:'FIRST', x:.5, y:.6, size:36 }
    ]},
    { answer: 'ALL IN ALL', options: ['All In All', 'All Or Nothing', 'Overall', 'All Along'],
      draw: [
        { t:'text', text:'ALL', x:.25, y:.5, size:40, bold:true },
        { t:'rect', x:.4, y:.35, w:.2, h:.3, stroke:'#fff' },
        { t:'text', text:'IN', x:.5, y:.53, size:24, bold:true },
        { t:'text', text:'ALL', x:.75, y:.5, size:40, bold:true }
    ]},
    { answer: 'FEELING UNDER THE WEATHER', options: ['Feeling Under The Weather', 'Weather Report', 'Storm Chaser', 'Rainbow'],
      draw: [
        { t:'text', text:'WEATHER', x:.5, y:.3, size:36, bold:true },
        { t:'line', x1:.15, y1:.48, x2:.85, y2:.48, width:2 },
        { t:'text', text:'FEELING', x:.5, y:.7, size:32, bold:true }
    ]},
    { answer: 'TOP OF THE WORLD', options: ['Top Of The World', 'World Cup', 'World Record', 'Worldwide'],
      draw: [
        { t:'text', text:'WORLD', x:.5, y:.6, size:48, bold:true },
        { t:'text', text:'TOP', x:.5, y:.25, size:32, bold:true }
    ]},
    { answer: 'LIFE SENTENCE', options: ['Life Sentence', 'Death Sentence', 'Run-on Sentence', 'Short Sentence'],
      draw: [
        { t:'text', text:'LIFE LIFE LIFE LIFE LIFE LIFE LIFE LIFE LIFE', x:.5, y:.5, size:11 }
    ]},
    { answer: 'BACKUP', options: ['Backup', 'Setup', 'Holdup', 'Lineup'],
      draw: [
        { t:'text', text:'← ← ←', x:.35, y:.4, size:20, color:'#8888a0' },
        { t:'text', text:'UP', x:.5, y:.6, size:48, bold:true }
    ]},
];

const BrainTeasers = {
    canvas: null, ctx: null, ui: null, animFrame: null,
    W: 800, H: 620, screen: 'title', lastTime: 0,
    score: 0, lives: 3, streak: 0, bestStreak: 0,
    timer: 0, maxTimer: 20,
    currentQ: null, options: [], answered: false, answerIdx: -1, correctIdx: -1,
    feedbackTimer: 0, pool: [], poolIdx: 0,
    particles: [], hoverBtn: -1,

    init(canvas, ctx, ui) {
        this.canvas = canvas; this.ctx = ctx; this.ui = ui;
        this.W = ui.canvasW; this.H = ui.canvasH;
        this._onKey = (e) => this.handleKey(e);
        this._onClick = (e) => this.handleClick(e);
        this._onMouseMove = (e) => this.handleMouseMove(e);
        this._onTouchStart = (e) => { e.preventDefault(); this.handleClick(e.changedTouches[0]); };
        document.addEventListener('keydown', this._onKey);
        canvas.addEventListener('click', this._onClick);
        canvas.addEventListener('mousemove', this._onMouseMove);
        canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    },
    start() { this.screen = 'title'; this.ui.hideGameOver(); this.ui.hidePause(); this.lastTime = performance.now(); this.loop(); },
    reset() { this.screen = 'title'; },
    pause() {}, resume() { this.lastTime = performance.now(); this.loop(); },
    destroy() {
        document.removeEventListener('keydown', this._onKey);
        this.canvas.removeEventListener('click', this._onClick);
        this.canvas.removeEventListener('mousemove', this._onMouseMove);
        this.canvas.removeEventListener('touchstart', this._onTouchStart);
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    },

    startGame() {
        this.score = 0; this.lives = 3; this.streak = 0; this.bestStreak = 0; this.particles = [];
        this.pool = [...PUZZLES].sort(() => Math.random() - 0.5);
        this.poolIdx = 0; this.screen = 'play'; this.nextQ();
    },

    nextQ() {
        if (this.poolIdx >= this.pool.length) { this.pool = [...PUZZLES].sort(() => Math.random() - 0.5); this.poolIdx = 0; }
        this.currentQ = this.pool[this.poolIdx++];
        this.answered = false; this.answerIdx = -1; this.feedbackTimer = 0;
        this.maxTimer = this.score < 5 ? 25 : this.score < 15 ? 20 : 15;
        this.timer = this.maxTimer;
        this.options = [...this.currentQ.options].sort(() => Math.random() - 0.5);
        this.correctIdx = this.options.indexOf(this.currentQ.options[0]); // first option is always correct
        this.ui.setScore(`Score: ${this.score}`);
    },

    selectAnswer(idx) {
        if (this.answered || this.screen !== 'play') return;
        this.answered = true; this.answerIdx = idx; this.feedbackTimer = 1.5;
        if (idx === this.correctIdx) {
            this.score++; this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
            for (let i = 0; i < 15; i++) { const a = Math.random() * Math.PI * 2; this.particles.push({ x: this.W / 2, y: 180, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.5 + Math.random() * 0.3, size: 3 + Math.random() * 3, color: ['#00e676', '#ffd60a', '#00d4ff'][Math.floor(Math.random() * 3)] }); }
        } else { this.lives--; this.streak = 0; if (this.lives <= 0) this.feedbackTimer = 2.5; }
    },

    getCanvasPos(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (this.W / r.width), y: (e.clientY - r.top) * (this.H / r.height) }; },
    getBtnRects() {
        const W = this.W, bw = 310, bh = 48, gap = 12, startY = 430;
        return [
            { x: W/2 - bw - gap/2, y: startY, w: bw, h: bh },
            { x: W/2 + gap/2, y: startY, w: bw, h: bh },
            { x: W/2 - bw - gap/2, y: startY + bh + gap, w: bw, h: bh },
            { x: W/2 + gap/2, y: startY + bh + gap, w: bw, h: bh }
        ];
    },
    hitTestBtn(mx, my) { for (let i = 0; i < 4; i++) { const r = this.getBtnRects()[i]; if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i; } return -1; },
    handleClick(e) { const p = this.getCanvasPos(e); if (this.screen === 'title' || this.screen === 'gameover') { this.startGame(); return; } if (this.screen === 'play' && !this.answered) { const i = this.hitTestBtn(p.x, p.y); if (i >= 0) this.selectAnswer(i); } },
    handleMouseMove(e) { this.hoverBtn = this.screen === 'play' ? this.hitTestBtn(this.getCanvasPos(e).x, this.getCanvasPos(e).y) : -1; },
    handleKey(e) {
        if (this.screen === 'title' || this.screen === 'gameover') { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.startGame(); } return; }
        if (e.key === '1') this.selectAnswer(0); if (e.key === '2') this.selectAnswer(1);
        if (e.key === '3') this.selectAnswer(2); if (e.key === '4') this.selectAnswer(3);
    },

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) { const p = this.particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; p.life -= dt; if (p.life <= 0) this.particles.splice(i, 1); }
        if (this.screen !== 'play') return;
        if (this.answered) { this.feedbackTimer -= dt; if (this.feedbackTimer <= 0) { if (this.lives <= 0) { this.screen = 'gameover'; this.ui.setHighScore(this.score); this.ui.showGameOver(this.score, this.ui.getHighScore()); } else this.nextQ(); } return; }
        this.timer -= dt;
        if (this.timer <= 0) { this.timer = 0; this.answered = true; this.answerIdx = -1; this.feedbackTimer = 2; this.lives--; this.streak = 0; if (this.lives <= 0) this.feedbackTimer = 2.5; }
    },

    // ─── Puzzle Renderer ───
    drawPuzzle(ctx, q, ox, oy, pw, ph) {
        for (const d of q.draw) {
            const ax = ox + d.x * pw, ay = oy + d.y * ph;
            ctx.save();
            if (d.opacity !== undefined) ctx.globalAlpha = d.opacity;

            if (d.t === 'text') {
                let font = '';
                if (d.bold) font += 'bold ';
                if (d.italic) font += 'italic ';
                font += (d.size || 32) + 'px ';
                font += d.size > 40 || !d.bold ? 'sans-serif' : 'Outfit, sans-serif';
                ctx.font = font;
                ctx.fillStyle = d.color || '#e8e8f0';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

                if (d.vertical) {
                    const chars = d.text.replace(/\n/g, '');
                    const lineH = (d.size || 32) * 1.1;
                    const totalH = chars.length * lineH;
                    for (let i = 0; i < chars.length; i++) {
                        ctx.fillText(chars[i], ax, ay - totalH / 2 + i * lineH + lineH / 2);
                    }
                } else if (d.flip) {
                    ctx.translate(ax, ay); ctx.scale(1, -1);
                    ctx.fillText(d.text, 0, 0);
                } else if (d.rotate) {
                    ctx.translate(ax, ay); ctx.rotate(d.rotate * Math.PI / 180);
                    ctx.fillText(d.text, 0, 0);
                } else if (d.clipHalf) {
                    ctx.save();
                    ctx.rect(ox, oy, pw, ph / 2 + (ay - oy));
                    ctx.clip();
                    ctx.fillText(d.text, ax, ay);
                    ctx.restore();
                    // Draw faded bottom half
                    ctx.save(); ctx.globalAlpha = 0.15;
                    ctx.fillText(d.text, ax, ay);
                    ctx.restore();
                } else if (d.spacing) {
                    const chars = d.text.split('');
                    const totalW = chars.reduce((a, c) => a + ctx.measureText(c).width + d.spacing, 0) - d.spacing;
                    let cx = ax - totalW / 2;
                    for (const c of chars) {
                        const cw = ctx.measureText(c).width;
                        ctx.fillText(c, cx + cw / 2, ay);
                        cx += cw + d.spacing;
                    }
                } else {
                    ctx.fillText(d.text, ax, ay);
                }
            } else if (d.t === 'line') {
                ctx.strokeStyle = d.color || 'rgba(255,255,255,0.5)';
                ctx.lineWidth = d.width || 2;
                ctx.beginPath();
                ctx.moveTo(ox + d.x1 * pw, oy + d.y1 * ph);
                ctx.lineTo(ox + d.x2 * pw, oy + d.y2 * ph);
                ctx.stroke();
            } else if (d.t === 'rect') {
                const rx = ox + d.x * pw, ry = oy + d.y * ph, rw = d.w * pw, rh = d.h * ph;
                if (d.fill) { ctx.fillStyle = d.fill; ctx.fillRect(rx, ry, rw, rh); }
                ctx.strokeStyle = d.stroke || '#fff'; ctx.lineWidth = 2;
                ctx.strokeRect(rx, ry, rw, rh);
            } else if (d.t === 'circle') {
                ctx.strokeStyle = d.stroke || 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(ox + d.cx * pw, oy + d.cy * ph, d.r * Math.min(pw, ph), 0, Math.PI * 2); ctx.stroke();
            } else if (d.t === 'ellipse') {
                ctx.strokeStyle = d.stroke || 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.ellipse(ox + d.cx * pw, oy + d.cy * ph, d.rx * pw, d.ry * ph, 0, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.restore();
        }
    },

    // ─── Render ───
    render() {
        const ctx = this.ctx, W = this.W, H = this.H;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,0.015)'; ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        for (const p of this.particles) { ctx.globalAlpha = Math.max(0, p.life / 0.5); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;

        if (this.screen === 'title') { this.renderTitle(ctx, W, H); return; }
        if (this.screen === 'gameover') { this.renderGameOver(ctx, W, H); return; }
        this.renderPlay(ctx, W, H);
    },

    renderTitle(ctx, W, H) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 40px Outfit, sans-serif';
        const g = ctx.createLinearGradient(W/2 - 180, 0, W/2 + 180, 0);
        g.addColorStop(0, '#00d4ff'); g.addColorStop(1, '#ffd60a');
        ctx.fillStyle = g; ctx.fillText('BRAIN TEASERS', W / 2, 140);
        ctx.font = '16px Outfit, sans-serif'; ctx.fillStyle = '#8888a0';
        ctx.fillText('Visual word puzzles — decode the arrangement!', W / 2, 175);

        // Example puzzle
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        this.rr(ctx, W/2 - 160, 210, 320, 180, 16); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
        this.rr(ctx, W/2 - 160, 210, 320, 180, 16); ctx.stroke();
        this.drawPuzzle(ctx, PUZZLES[0], W/2 - 160, 210, 320, 180);

        ctx.font = 'bold 22px Outfit, sans-serif'; ctx.fillStyle = '#00e676';
        ctx.fillText('= TOP SECRET', W / 2, 420);

        const pulse = 0.7 + Math.sin(performance.now() / 400) * 0.3;
        ctx.globalAlpha = pulse; ctx.font = 'bold 18px Outfit, sans-serif'; ctx.fillStyle = '#00d4ff';
        ctx.fillText('Click or press SPACE to start', W / 2, 500); ctx.globalAlpha = 1;
        const best = this.ui.getHighScore();
        if (best) { ctx.font = '14px JetBrains Mono, monospace'; ctx.fillStyle = '#ffd60a'; ctx.fillText(`Best: ${best}`, W / 2, 540); }
    },

    renderGameOver(ctx, W, H) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px Outfit, sans-serif'; ctx.fillStyle = '#ff2d7b'; ctx.fillText('GAME OVER', W / 2, 150);
        ctx.font = 'bold 64px JetBrains Mono, monospace'; ctx.fillStyle = '#e8e8f0'; ctx.fillText(this.score, W / 2, 250);
        ctx.font = '16px Outfit, sans-serif'; ctx.fillStyle = '#8888a0'; ctx.fillText('puzzles solved', W / 2, 285);
        ctx.font = '14px JetBrains Mono, monospace'; ctx.fillStyle = '#ffd60a'; ctx.fillText(`Best streak: ${this.bestStreak}`, W / 2, 325);
        ctx.fillStyle = '#00e676'; ctx.fillText(`High score: ${this.ui.getHighScore()}`, W / 2, 355);
        if (this.currentQ) { ctx.font = '15px Outfit, sans-serif'; ctx.fillStyle = '#8888a0'; ctx.fillText(`The answer was: ${this.currentQ.answer}`, W / 2, 400); }
        const pulse = 0.7 + Math.sin(performance.now() / 400) * 0.3;
        ctx.globalAlpha = pulse; ctx.font = 'bold 18px Outfit, sans-serif'; ctx.fillStyle = '#00d4ff';
        ctx.fillText('Click or press SPACE to play again', W / 2, 490); ctx.globalAlpha = 1;
    },

    renderPlay(ctx, W, H) {
        const q = this.currentQ; if (!q) return;

        // HUD
        ctx.font = '22px sans-serif'; ctx.textAlign = 'left';
        let hearts = ''; for (let i = 0; i < 3; i++) hearts += i < this.lives ? '❤️' : '🖤';
        ctx.fillText(hearts, 16, 30);
        ctx.font = 'bold 16px JetBrains Mono, monospace'; ctx.fillStyle = '#e8e8f0'; ctx.textAlign = 'right';
        ctx.fillText(`Score: ${this.score}`, W - 16, 26);
        if (this.streak >= 3) { ctx.fillStyle = '#ffd60a'; ctx.font = 'bold 13px JetBrains Mono, monospace'; ctx.fillText(`🔥 ${this.streak}`, W - 16, 46); }

        // Timer
        const barW = 500, barH = 5, barX = (W - barW) / 2, barY = 50;
        const pct = Math.max(0, this.timer / this.maxTimer);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; this.rr(ctx, barX, barY, barW, barH, 3); ctx.fill();
        ctx.fillStyle = pct > 0.5 ? '#00e676' : pct > 0.25 ? '#ffd60a' : '#ff2d7b';
        if (barW * pct > 0) { this.rr(ctx, barX, barY, barW * pct, barH, 3); ctx.fill(); }

        // Puzzle area
        const px = 100, py = 70, pw = W - 200, ph = 340;
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        this.rr(ctx, px, py, pw, ph, 16); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
        this.rr(ctx, px, py, pw, ph, 16); ctx.stroke();

        this.drawPuzzle(ctx, q, px, py, pw, ph);

        // "What phrase is this?"
        ctx.font = '15px Outfit, sans-serif'; ctx.fillStyle = '#8888a0'; ctx.textAlign = 'center';
        ctx.fillText('What phrase is this?', W / 2, py + ph + 22);

        // Buttons
        const rects = this.getBtnRects();
        for (let i = 0; i < 4; i++) {
            const r = rects[i];
            let bg = 'rgba(255,255,255,0.04)', border = 'rgba(255,255,255,0.08)', tc = '#e8e8f0';
            if (this.answered) {
                if (i === this.correctIdx) { bg = 'rgba(0,230,118,0.2)'; border = '#00e676'; tc = '#00e676'; }
                else if (i === this.answerIdx && i !== this.correctIdx) { bg = 'rgba(255,45,123,0.2)'; border = '#ff2d7b'; tc = '#ff2d7b'; }
            } else if (this.hoverBtn === i) { bg = 'rgba(0,212,255,0.1)'; border = 'rgba(0,212,255,0.4)'; }

            ctx.fillStyle = bg; this.rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
            ctx.strokeStyle = border; ctx.lineWidth = 1.5; this.rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.stroke();

            ctx.fillStyle = 'rgba(255,255,255,0.08)'; this.rr(ctx, r.x + 10, r.y + (r.h - 26) / 2, 26, 26, 6); ctx.fill();
            ctx.font = 'bold 13px JetBrains Mono, monospace'; ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.textAlign = 'center';
            ctx.fillText(String(i + 1), r.x + 23, r.y + r.h / 2 + 5);
            ctx.font = 'bold 15px Outfit, sans-serif'; ctx.fillStyle = tc;
            ctx.fillText(this.options[i], r.x + r.w / 2 + 10, r.y + r.h / 2 + 5);
        }

        if (this.answered) {
            ctx.textAlign = 'center';
            if (this.answerIdx === this.correctIdx) { ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillStyle = '#00e676'; ctx.fillText('✅ Correct!', W / 2, 420); }
            else { ctx.font = 'bold 20px Outfit, sans-serif'; ctx.fillStyle = '#ff2d7b'; ctx.fillText(`${this.answerIdx === -1 ? '⏰ Time\'s up!' : '❌ Wrong!'} Answer: ${q.answer}`, W / 2, 420); }
        }
    },

    rr(ctx, x, y, w, h, r) {
        if (w <= 0) return; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    },

    loop() {
        const now = performance.now(); let dt = (now - this.lastTime) / 1000; this.lastTime = now;
        if (dt > 0.05) dt = 0.05; this.update(dt); this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    }
};

export default BrainTeasers;
