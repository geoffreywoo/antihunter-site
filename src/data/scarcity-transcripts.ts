interface SceneTranscript {
  title: string;
  fiction: string;
  panels: {
    heading: string;
    action: string;
    labels: string[];
    dialogue: {speaker: string; text: string}[];
  }[];
}

export const scarcityTranscripts = {
  'the-best-bit': {
    title: 'The Best Bit',
    fiction: 'Original fiction. The recall and story projector are invented capabilities.',
    panels: [
      {heading: 'The exact replay', action: 'Anti Hunter describes his fishing trip. The replay shows a tiny fish beside the boat.', labels: ['EXACT REPLAY · 12 CM'], dialogue: [{speaker: 'Anti Hunter', text: 'It nearly sank the boat.'}]},
      {heading: 'A different mode', action: 'The Temp saves the exact replay and selects a separate fiction mode. The accurate record stays saved.', labels: ['EXACT REPLAY ✓ SAVED', 'STORY MODE · FICTION'], dialogue: [{speaker: 'Temp', text: "You're leaving out the best bit."}]},
      {heading: 'The tall tale', action: 'Inside the clearly labeled fictional projection, a fish with legs carries the boat. Outside the projection, Anti Hunter leans in to listen to the Temp.', labels: ['STORY MODE · FICTION'], dialogue: [{speaker: 'Temp', text: 'It walked us home.'}, {speaker: 'Anti Hunter', text: 'Go on.'}]},
    ],
  },
  borrowed: {
    title: 'Borrowed',
    fiction: 'Original fiction. The coat, repair and official portrait belong to an imagined scene.',
    panels: [
      {heading: 'The repair', action: 'A cleaner restores the Temp’s red coat, which Anti Hunter is wearing over an undershirt and tie. The portrait camera is ready. The remedy console treats the damage as resolved.', labels: ['PORTRAIT READY', 'DAMAGE: 0', 'CASE CLOSED'], dialogue: [{speaker: 'Anti Hunter', text: 'Good as new.'}, {speaker: 'Temp', text: 'Still mine.'}]},
      {heading: 'The return', action: 'The Temp explains that she never lent him the coat. Anti Hunter hands it back while the portrait countdown continues.', labels: ['PORTRAIT IN', '3… 2…'], dialogue: [{speaker: 'Temp', text: 'I didn’t lend it to you.'}]},
      {heading: 'The portrait', action: 'The saved portrait shows the Temp wearing her red coat and Anti Hunter in an undershirt and tie. He chooses to keep that picture.', labels: ['PORTRAIT SAVED'], dialogue: [{speaker: 'Anti Hunter', text: 'Use that one.'}, {speaker: 'Temp', text: 'I look great.'}]},
    ],
  },
  'no-surprises': {
    title: 'No Surprises',
    fiction: 'Original fiction. The wedding, guests and approvals are invented, not campaign results.',
    panels: [
      {heading: 'The approved toast', action: 'A speechwriter supplies the toast, approved by every guest. Anti Hunter holds the script. The Temp waits by her music player and the empty dance floor.', labels: ['A WEDDING TOAST', 'TOAST APPROVED BY EVERY GUEST', 'MUSIC READY'], dialogue: [{speaker: 'Anti Hunter', text: 'No surprises.'}]},
      {heading: 'The audience knows the words', action: 'Anti Hunter starts speaking. The guests finish the next words together before he reaches them.', labels: ['MUSIC READY'], dialogue: [{speaker: 'Anti Hunter', text: 'To all…'}, {speaker: 'Guests', text: 'OUR DAYS TOGETHER!'}]},
      {heading: 'The chorus', action: 'Anti Hunter puts the script down and conducts. The Temp starts the music. The same guests sing the words and begin dancing.', labels: ['PLAYING'], dialogue: [{speaker: 'Guests', text: 'To all our days together.'}]},
    ],
  },
  'yesterday-me': {
    title: 'Yesterday Me',
    fiction: 'Original fiction. The personal-memory device, song and concert are invented; no present capability is claimed.',
    panels: [
      {heading: 'Yesterday', action: 'Anti Hunter writes a duet, marked with his initials AH, and invites the Temp to perform it tomorrow.', labels: ['SCORE · AH', 'DUET', 'TOMORROW'], dialogue: [{speaker: 'Anti Hunter', text: 'Duet tomorrow?'}, {speaker: 'Temp', text: 'Count me in.'}]},
      {heading: 'Today', action: 'Anti Hunter uses a fictional device to restore only his own memory to before writing the song. The shared score and the Temp’s memory remain.', labels: ['MY MEMORY ONLY', 'BEFORE WRITING IT', 'RESTORED'], dialogue: [{speaker: 'Anti Hunter', text: 'Let me hear it fresh.'}]},
      {heading: 'Tonight', action: 'At the concert, the score still bears AH. Anti Hunter praises the song without recognizing his own work. The Temp hands him a microphone and cues his promised part in the duet.', labels: ['SCORE · AH', 'DUET · TONIGHT'], dialogue: [{speaker: 'Anti Hunter', text: 'Whoever wrote this has excellent taste.'}, {speaker: 'Temp', text: 'Your cue.'}]},
    ],
  },
  "the-last-job": {
    "title": "The Last Job",
    "fiction": "Original fiction. The completed work and future boardroom are an imagined scene.",
    "panels": [
      {
        "heading": "The boardroom",
        "action": "A smiling robot holds a tall stack of completed work. Anti Hunter sits at a conference table with bored-looking executives. A circular meeting agenda is drawn on the wall; a thick binder of meeting logistics sits on the table.",
        "labels": [
          "REPORTS ✓",
          "ANALYSIS ✓",
          "PRESENTATIONS ✓",
          "SUMMARIES ✓",
          "STRATEGY ✓",
          "EMAILS ✓",
          "RESEARCH ✓",
          "PLANS ✓",
          "FOLLOW UPS ✓",
          "DONE ✓",
          "MEETING ABOUT THE MEETING",
          "ALIGN ON AGENDA",
          "SCHEDULE NEXT MEETING",
          "SAME MEETING DIFFERENT DAY",
          "MEETING LOGISTICS"
        ],
        "dialogue": []
      }
    ]
  },
  "the-wet-signature": {
    "title": "The Wet Signature",
    "fiction": "Original fiction. The finished homes and municipal office belong to an imagined abundant future.",
    "panels": [
      {
        "heading": "The municipal desk",
        "action": "Anti Hunter points toward completed homes while smiling construction robots stand behind him. At the municipal services desk, a zoning official holds an oversized fountain pen beside a thick stack of forms and an ink bottle.",
        "labels": [
          "FORM",
          "ZONING DEPT.",
          "INK",
          "MUNICIPAL SERVICES",
          "A MORE ABUNDANT TOMORROW",
          "SAME PROCESS BRIGHTER TOMORROW"
        ],
        "dialogue": []
      }
    ]
  },
  "retirement-cancelled": {
    "title": "Retirement Cancelled",
    "fiction": "Original fiction. The longevity, birthday and HR policy are invented, not a present medical capability.",
    "panels": [
      {
        "heading": "Another birthday, another onboarding",
        "action": "A laughing older woman sits beside a candle-covered birthday cake marked 200. A smiling HR robot presents a thick stack of onboarding paperwork. Anti Hunter sits with his head resting on his hand. The city behind them looks bright and green.",
        "labels": [
          "200",
          "HR",
          "ONBOARDING AGAIN",
          "STILL HERE FOR IT",
          "SAME DIFFERENT DAY",
          "MORE PEOPLE BRIGHTER TOMORROWS",
          "LONGER HEALTHIER HAPPIER TOGETHER",
          "ABUNDANCE LOOKS GOOD ON EVERYONE"
        ],
        "dialogue": []
      }
    ]
  },
  "out-of-office": {
    "title": "Out of Office",
    "fiction": "Original fiction. The completed work, leave requests and HR policy are an imagined office.",
    "panels": [
      {
        "heading": "Leave request",
        "action": "Anti Hunter asks for an afternoon at the beach. The work is complete, but the leave form has an empty covering-employee box.",
        "labels": [
          "ALL TASKS COMPLETE ✓",
          "COVERING EMPLOYEE"
        ],
        "dialogue": [
          {
            "speaker": "Anti Hunter",
            "text": "Everything is done. I’m going to the beach."
          },
          {
            "speaker": "HR",
            "text": "Who’s covering?"
          }
        ]
      },
      {
        "heading": "Problem solved",
        "action": "Anti Hunter hires a Temp. She also asks to leave; a second form has the same empty box.",
        "labels": [],
        "dialogue": [
          {
            "speaker": "Temp",
            "text": "Everything is done. Can I leave too?"
          }
        ]
      },
      {
        "heading": "Coverage arranged",
        "action": "Anti Hunter becomes the covering employee. The Temp is pictured at the beach; he stays at the desk. The narration reads: Me. The temp got the beach. I got her shift.",
        "labels": [],
        "dialogue": [
          {
            "speaker": "HR",
            "text": "Who’s covering?"
          }
        ]
      }
    ]
  },
  "guest-list": {
    "title": "Guest List",
    "fiction": "Original fiction. The beach, event and assigned roles are invented.",
    "panels": [
      {
        "heading": "Grand opening",
        "action": "Anti Hunter reaches the beach and hopes for an afternoon off. The opening captions read: Enough beach for everyone. Finally, an afternoon off.",
        "labels": [
          "GRAND OPENING"
        ],
        "dialogue": []
      },
      {
        "heading": "Introductions",
        "action": "Anti Hunter introduces himself to the host at check-in.",
        "labels": [
          "CHECK-IN"
        ],
        "dialogue": [
          {
            "speaker": "Host",
            "text": "Your role?"
          },
          {
            "speaker": "Anti Hunter",
            "text": "I built all this."
          }
        ]
      },
      {
        "heading": "Role assigned",
        "action": "Anti Hunter receives a STAFF wristband. The Temp is beside him with a GUEST wristband.",
        "labels": [
          "STAFF",
          "GUEST"
        ],
        "dialogue": [
          {
            "speaker": "Host",
            "text": "Lovely. Staff briefing starts in five."
          }
        ]
      }
    ]
  },
  "plain-english": {
    "title": "Plain English",
    "fiction": "Original fiction. The universal translator, board and output modes are invented.",
    "panels": [
      {
        "heading": "Translation works",
        "action": "The chair speaks across the boardroom table. The universal translator displays the plain-English meaning.",
        "labels": [
          "UNIVERSAL TRANSLATOR",
          "PLAIN ENGLISH",
          "We haven’t decided."
        ],
        "dialogue": [
          {
            "speaker": "Chair",
            "text": "We are preserving strategic optionality."
          }
        ]
      },
      {
        "heading": "A special request",
        "action": "The chair asks Anti Hunter to reverse the translation. The display still shows the plain-English sentence.",
        "labels": [
          "PLAIN ENGLISH",
          "We haven’t decided."
        ],
        "dialogue": [
          {
            "speaker": "Chair",
            "text": "Can you translate it back?"
          }
        ]
      },
      {
        "heading": "Message received",
        "action": "Anti Hunter presses APPLY for Investor Relations output mode. The display restores the original jargon, and the chair applauds.",
        "labels": [
          "OUTPUT MODE",
          "INVESTOR RELATIONS",
          "TRANSLATION COMPLETE",
          "We are preserving strategic optionality.",
          "APPLY"
        ],
        "dialogue": []
      }
    ]
  },
  "we-should-grab-coffee": {
    "title": "We Should Grab Coffee",
    "fiction": "Original fiction. The networking machines and conference are an imagined scene.",
    "panels": [
      {
        "heading": "The agents make plans",
        "action": "Two badge-wearing networking machines face one another at a conference. The speech bubbles belong to the machines.",
        "labels": [
          "NETWORKING"
        ],
        "dialogue": [
          {
            "speaker": "First networking machine",
            "text": "We should grab coffee."
          },
          {
            "speaker": "Second networking machine",
            "text": "Definitely."
          }
        ]
      },
      {
        "heading": "The people have coffee",
        "action": "Beside the networking scene, Anti Hunter and the Temp sit at a small round table with two steaming cups.",
        "labels": [],
        "dialogue": []
      }
    ]
  },
  "sponsored-weather": {
    "title": "Sponsored Weather",
    "fiction": "Original fiction. Weather control, the advertiser and the demonstration are invented, not actual revenue or a deployed product.",
    "panels": [
      {
        "heading": "Perfect weather",
        "action": "Anti Hunter and a bystander stand in sunshine beside a weather console.",
        "labels": [
          "WEATHER: PERFECT"
        ],
        "dialogue": []
      },
      {
        "heading": "The promotion",
        "action": "Anti Hunter selects an umbrella promotion and reaches toward TRY ON ME.",
        "labels": [
          "SPONSORED WEATHER",
          "Umbrella promotion",
          "TRY ON ME"
        ],
        "dialogue": [
          {
            "speaker": "Anti Hunter",
            "text": "Now make it pay."
          }
        ]
      },
      {
        "heading": "The target audience",
        "action": "A cloud rains only on Anti Hunter. A robot offers him an umbrella while the bystander stays dry under the sun.",
        "labels": [
          "SPONSORED"
        ],
        "dialogue": []
      }
    ]
  },
  "unbeatable": {
    "title": "Unbeatable",
    "fiction": "Original fiction. The tennis partners, wins and rally counters are story props, not campaign metrics.",
    "panels": [
      {
        "heading": "Two requests",
        "action": "Anti Hunter and the Temp each have a robot tennis partner on adjacent courts.",
        "labels": [],
        "dialogue": [
          {
            "speaker": "Anti Hunter",
            "text": "Never let me lose."
          },
          {
            "speaker": "Temp",
            "text": "Keep the rally going."
          }
        ]
      },
      {
        "heading": "Later",
        "action": "Trophies begin filling Anti Hunter’s side. The Temp and her partner keep hitting the ball back and forth.",
        "labels": [
          "LATER",
          "WINS: 10"
        ],
        "dialogue": [
          {
            "speaker": "Anti Hunter",
            "text": "Again."
          }
        ]
      },
      {
        "heading": "The result",
        "action": "A wall of trophies fills Anti Hunter’s court while his robot holds another cup. The Temp and her partner still have room for their rally.",
        "labels": [
          "100% WIN RATE",
          "RALLY: 247"
        ],
        "dialogue": []
      }
    ]
  },
  "heavy-lifting": {
    "title": "Heavy Lifting",
    "fiction": "Original fiction. The coffee machine and detached leadership crank are invented props.",
    "panels": [
      {
        "heading": "The work is easy",
        "action": "The coffee machine fills a cup for the Temp. Anti Hunter gestures toward the machine.",
        "labels": [],
        "dialogue": [
          {
            "speaker": "Anti Hunter",
            "text": "Can you make it look harder?"
          }
        ]
      },
      {
        "heading": "The leadership role",
        "action": "A robot presents a large hand crank beside the machine. Its axle does not connect to the coffee machine, which keeps filling the cup.",
        "labels": [],
        "dialogue": [
          {
            "speaker": "Anti Hunter",
            "text": "Much better."
          }
        ]
      },
      {
        "heading": "The work continues",
        "action": "Anti Hunter sweats as he turns the detached crank. The Temp holds her filled cup beside the independently working coffee machine.",
        "labels": [],
        "dialogue": [
          {
            "speaker": "Temp",
            "text": "You can stop."
          }
        ]
      }
    ]
  },
  "ground-rules": {
    "title": "Ground Rules",
    "fiction": "Original fiction. The self-repairing lawn, rule and rope game are imagined.",
    "panels": [
      {
        "heading": "The upgrade",
        "action": "A robot rolls out self-repairing turf while Anti Hunter watches.",
        "labels": [],
        "dialogue": [
          {
            "speaker": "Robot",
            "text": "Self-repairing turf."
          },
          {
            "speaker": "Anti Hunter",
            "text": "Perfect."
          }
        ]
      },
      {
        "heading": "The rule",
        "action": "A rope barrier stands below KEEP OFF THE GRASS. The Temp takes one end and asks Anti Hunter to hold the other.",
        "labels": [
          "KEEP OFF THE GRASS"
        ],
        "dialogue": [
          {
            "speaker": "Temp",
            "text": "Hold this."
          }
        ]
      },
      {
        "heading": "The game",
        "action": "Anti Hunter and the robot hold the rope as the Temp jumps over it on the lawn. The barrier posts are now empty.",
        "labels": [],
        "dialogue": [
          {
            "speaker": "Anti Hunter",
            "text": "Who authorized this?"
          },
          {
            "speaker": "Temp",
            "text": "You're holding the other end."
          }
        ]
      }
    ]
  },
  "personal-editions": {
    "title": "Personal Editions",
    "fiction": "Original fiction. The personalized books and their contradictory plots are invented.",
    "panels": [
      {
        "heading": "One request, personal plots",
        "action": "Anti Hunter asks the fabricator for one book everyone will love while it is set to personalized plots. It produces matching covers with different editions.",
        "labels": [
          "PERSONALIZED PLOTS ✓",
          "PERSONAL EDITIONS"
        ],
        "dialogue": [
          {
            "speaker": "Anti Hunter",
            "text": "One book. Make everyone love it."
          }
        ]
      },
      {
        "heading": "The discussion",
        "action": "At the table, the Temp’s open book depicts a detective story. Another guest’s depicts a romance. Anti Hunter sits between them with his own edition.",
        "labels": [],
        "dialogue": [
          {
            "speaker": "Temp",
            "text": "Who killed the detective?"
          },
          {
            "speaker": "Guest",
            "text": "Nobody. She marries the butler."
          }
        ]
      },
      {
        "heading": "The exchange",
        "action": "The guest hands her edition to Anti Hunter, who has set his own copy on the table. The Temp watches the handoff.",
        "labels": [
          "BOOK CLUB"
        ],
        "dialogue": [
          {
            "speaker": "Anti Hunter",
            "text": "I'm going to need your copy."
          }
        ]
      }
    ]
  },
  "the-minimum-charge": {
    "title": "The Minimum Charge",
    "fiction": "Original fiction. The energy breakthrough, utility statement and prices are invented.",
    "panels": [
      {
        "heading": "The fictional utility statement",
        "action": "The card reads: We made energy free. The bill survived. A utility statement still charges a minimum even though its energy cost is zero.",
        "labels": [
          "FICTIONAL UTILITY STATEMENT",
          "ENERGY USED · 9,000 kWh",
          "Energy cost · $0.00",
          "Minimum bill charge · $42.00",
          "Thank you for going paperless."
        ],
        "dialogue": []
      }
    ]
  },
  "boarding-group-nine": {
    "title": "Boarding Group Nine",
    "fiction": "Original fiction. Instant travel, the terminal and boarding rules are invented; no present teleportation capability is claimed.",
    "panels": [
      {
        "heading": "The terminal",
        "action": "A portal is ready beside a board calling Group 1. Anti Hunter’s boarding pass is for Group 9. The heading reads: Instant travel. The queue made the journey.",
        "labels": [
          "NOW BOARDING · GROUP 1",
          "JOURNEY TIME: 0 SECONDS",
          "PORTAL READY",
          "BOARDING PASS / ANTI HUNTER",
          "ANYWHERE. EVENTUALLY.",
          "YOUR GROUP · 9"
        ],
        "dialogue": []
      }
    ]
  },
  "grand-openings": {
    "title": "Grand Openings",
    "fiction": "Original fiction. The bridges, mayor’s calendar and ceremonial backlog are invented.",
    "panels": [
      {
        "heading": "The bridge is open",
        "action": "Cars are already crossing the completed bridge.",
        "labels": [
          "BRIDGES: OPEN",
          "Already carrying traffic."
        ],
        "dialogue": []
      },
      {
        "heading": "The ceremony is booked",
        "action": "A filled mayor’s calendar stands beside large ceremonial scissors.",
        "labels": [
          "GRAND OPENINGS: BOOKED",
          "Next ceremony: 14 months.",
          "MAYOR’S CALENDAR"
        ],
        "dialogue": []
      }
    ]
  },
  "museum-piece": {
    "title": "Museum Piece",
    "fiction": "Original fiction. The repair technology, Museum of Work and deliberately jammed replica are invented.",
    "panels": [
      {
        "heading": "The last repair",
        "action": "A robot clears the printer jam. Anti Hunter holds a clean printed page beside the working printer.",
        "labels": [],
        "dialogue": [
          {
            "speaker": "Robot",
            "text": "Last jam cleared."
          }
        ]
      },
      {
        "heading": "A different task",
        "action": "At the Museum of Work, the Temp points to a framed reference picture of a jammed printer and commissions a matching replica.",
        "labels": [
          "MUSEUM OF WORK",
          "REFERENCE"
        ],
        "dialogue": [
          {
            "speaker": "Temp",
            "text": "Match the original."
          }
        ]
      },
      {
        "heading": "The exhibit",
        "action": "A replica printer with the same paper jam sits under glass and a spotlight. Anti Hunter, the Temp and the robot stand beside the completed exhibit.",
        "labels": [
          "PAPER JAM · REPLICA",
          "DO NOT REPAIR"
        ],
        "dialogue": []
      }
    ]
  },
  "closing-the-loop": {
    "title": "Closing the Loop",
    "fiction": "Original fiction. The repair, survey, ratings and all counts are story props, not actual customer or campaign results.",
    "panels": [
      {
        "heading": "The useful repair",
        "action": "A robot returns a working phone with a check mark to the Temp. A broken screen is pictured below; Anti Hunter watches.",
        "labels": [],
        "dialogue": [
          {
            "speaker": "Temp",
            "text": "thanks."
          }
        ]
      },
      {
        "heading": "The survey request",
        "action": "Anti Hunter asks whether robots can answer the surveys. The Temp points to the source-label switch, which stays on. Two robots have SURVEY A and SURVEY B labels.",
        "labels": [
          "HUMAN 1",
          "ROBOT 0",
          "SOURCE LABELS",
          "SURVEY A",
          "SURVEY B"
        ],
        "dialogue": [
          {
            "speaker": "Anti Hunter",
            "text": "can our bots answer these?"
          },
          {
            "speaker": "Temp",
            "text": "keep the labels."
          }
        ]
      },
      {
        "heading": "The combined total",
        "action": "The display keeps the human and robot counts separate beneath a combined total. Anti Hunter celebrates it. The two survey robots ask one another for ratings on five-star cards, linked by looping arrows. The Temp uses her repaired phone for her own call.",
        "labels": [
          "SURVEY RESPONSES",
          "TOTAL 2,001",
          "HUMAN 1",
          "ROBOT 2,000",
          "SURVEY A",
          "SURVEY B",
          "★★★★★"
        ],
        "dialogue": [
          {
            "speaker": "Anti Hunter",
            "text": "now we're listening."
          },
          {
            "speaker": "Survey A robot",
            "text": "rate me?"
          },
          {
            "speaker": "Survey B robot",
            "text": "rate me?"
          }
        ]
      }
    ]
  }
} satisfies Record<string, SceneTranscript>;
