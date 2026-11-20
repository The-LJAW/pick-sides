// Hand-written roast lines. A roast is built from three parts:
//   1. an opener about the hot take, or about the #1 pick when there is none
//   2. a line about their type (archetype)
//   3. a closer about their last place pick
// Each part is chosen from the lines below based on the ranking, so the same
// ranking always gets the same roast, and different rankings rarely share one.
//
// Rules for new lines: tease the taste, never the person. Keep it clean;
// kids play this with their grandparents.

// Lines about a specific item at #1 (top) or in last place (last).
export const ITEM_LINES = {
  // ---- Thanksgiving ----
  turkey: {
    top: [
      'Turkey at number one. Respectful. Predictable. Like a greeting card.',
      'You ranked the turkey first, which is exactly what the turkey would have wanted.',
      'Turkey first? You are the reason the bird gets the center of the table.',
    ],
    last: [
      'Turkey in last place at a holiday literally named after it is a bold protest.',
      'Turkey dead last. The bird gave everything and you gave it nothing.',
      'You put the turkey last, so the whole holiday is basically side dishes to you.',
    ],
  },
  stuffing: {
    top: [
      'Stuffing at number one. Bread that has been through something, and you love it.',
      'Stuffing first is the correct answer and we are a little annoyed you got it right.',
      'You picked stuffing first, which means you have opinions about crispy edges.',
    ],
    last: [
      'Stuffing in last place? Somewhere a grandmother just put down her wooden spoon.',
      'Stuffing dead last. You looked at seasoned bread and said no thank you.',
      'Last place for stuffing is a take that will be discussed at future holidays.',
    ],
  },
  mashed: {
    top: [
      'Mashed potatoes first. You want your food to feel like a hug.',
      'Mashed potatoes at number one. Simple, buttery, and slightly smug about it.',
      'You ranked mashed potatoes first, so your plate starts with a volcano and a gravy lake.',
    ],
    last: [
      'Mashed potatoes in last place. Who hurt you, and was it a lumpy batch?',
      'Mashed potatoes dead last is the culinary version of leaving a party early.',
      'You put mashed potatoes last, which means more for everyone else. Thank you, we guess.',
    ],
  },
  gravy: {
    top: [
      'Gravy at number one. Technically a sauce, and you do not care.',
      'You ranked gravy first, so your real favourite food is whatever is under the gravy.',
      'Gravy first means you have, at least once, asked for a separate gravy boat.',
    ],
    last: [
      'Gravy in last place? You eat your turkey dry and you are at peace with that.',
      'Gravy dead last. A whole boat of it, sailing past you untouched.',
      'Last place for gravy is brave. Dry stuffing is a hard road.',
    ],
  },
  cranberry: {
    top: [
      'Cranberry sauce first. Do you like the can ridges? Be honest.',
      'Cranberry sauce at number one is the most chaotic thing on this list.',
      'You ranked cranberry sauce first, the only food on the table that wobbles.',
    ],
    last: [
      'Cranberry sauce in last place. The can-shaped log will survive without you.',
      'Cranberry sauce dead last, along with the rest of the country, honestly.',
      'You put cranberry sauce last, so you have never once found the end of the can satisfying.',
    ],
  },
  greenbean: {
    top: [
      'Green bean casserole first. The crispy onions are doing a lot of work for you.',
      'Green bean casserole at number one. A vegetable, technically, if you squint.',
      'You ranked green bean casserole first, which is a vote for soup as a building material.',
    ],
    last: [
      'Green bean casserole dead last. The crunchy onions tried their best.',
      'Green bean casserole in last place. It sits there every year, waiting to be chosen.',
      'Last place for green bean casserole is fair, but someone made that.',
    ],
  },
  sweetpotato: {
    top: [
      'Sweet potato casserole first. Dessert, but you get to eat it during dinner.',
      'Sweet potato casserole at number one, because marshmallows count as a vegetable topping now.',
      'You ranked sweet potato casserole first, and the marshmallows thank you personally.',
    ],
    last: [
      'Sweet potato casserole in last place. You looked at marshmallows on a potato and said absolutely not.',
      'Sweet potato casserole dead last. Somebody brought that with a lot of hope.',
      'Last place for sweet potato casserole means you think dessert belongs after dinner. Old-fashioned.',
    ],
  },
  mac: {
    top: [
      'Mac and cheese first at Thanksgiving is a kids table energy we respect.',
      'Mac and cheese at number one. You would have been happy with just this and a fork.',
      'You ranked mac and cheese first, which means you check for the crispy corner pieces.',
    ],
    last: [
      'Mac and cheese in last place. You turned down cheese. On purpose.',
      'Mac and cheese dead last is a choice every child at the table will hold against you.',
      'Last place for mac and cheese. We will be checking on you.',
    ],
  },
  rolls: {
    top: [
      'Dinner rolls first. Out of all this food, you came here for bread.',
      'Dinner rolls at number one means your real job at dinner is gravy cleanup.',
      'You ranked rolls first. You have definitely taken three and hidden one.',
    ],
    last: [
      'Dinner rolls in last place. Bread did nothing to you.',
      'Rolls dead last. Fine, more butter for everyone else.',
      'Last place for dinner rolls is how you know you have never run out of gravy.',
    ],
  },
  corn: {
    top: [
      'Corn at number one. Of all the dishes, you picked the one that also comes in a can.',
      'Corn first is the sort of quiet, sunny choice nobody can argue with, though we will try.',
      'You ranked corn first, so your favourite part of Thanksgiving is a side dish from July.',
    ],
    last: [
      'Corn in last place. It was just sitting there being yellow.',
      'Corn dead last, which is fair. Nobody has ever been excited about the corn.',
      'Last place for corn. Somewhere a scarecrow is disappointed.',
    ],
  },
  brussels: {
    top: [
      'Brussels sprouts at number one? Are you an adult now? When did that happen?',
      'Brussels sprouts first. Somewhere, your childhood self is horrified.',
      'You ranked Brussels sprouts first, which means you say roasted, not boiled, very firmly.',
    ],
    last: [
      'Brussels sprouts in last place, the most popular opinion in history.',
      'Brussels sprouts dead last. Tiny cabbages, huge disappointment.',
      'Last place for Brussels sprouts is right where the kids table would have put them too.',
    ],
  },
  pie: {
    top: [
      'Pumpkin pie first. You sat through an entire dinner waiting for this.',
      'Pumpkin pie at number one, which means the meal was just the opening act.',
      'You ranked pie first. Whipped cream is involved, and so is a second slice.',
    ],
    last: [
      'Pumpkin pie in last place. Thanksgiving dessert, rejected by you personally.',
      'Pumpkin pie dead last. More for the people who saved room.',
      'Last place for pumpkin pie. You must be a pecan person, quietly.',
    ],
  },

  // ---- Halloween ----
  reeses: {
    top: [
      'Reese\'s at number one. Peanut butter and chocolate, the most agreed-on choice in history.',
      'Reese\'s first. You check the bucket for orange wrappers before anything else.',
      'You ranked Reese\'s first, which means you have eaten the cup and the ridges separately.',
    ],
    last: [
      'Reese\'s in last place? Trade them away immediately, people are lining up.',
      'Reese\'s dead last is the bravest thing anyone has done with this app.',
      'Last place for Reese\'s. Your trading power is incredible though.',
    ],
  },
  snickers: {
    top: [
      'Snickers at number one. You like your candy to count as a meal.',
      'Snickers first. Peanuts, caramel, nougat, and a strong sense of purpose.',
      'You ranked Snickers first, which means you eat a fun size in one bite.',
    ],
    last: [
      'Snickers in last place. You are not hungry enough to understand it.',
      'Snickers dead last. Somebody dislikes nougat and we found them.',
      'Last place for Snickers, so you skip the most filling thing in the bucket.',
    ],
  },
  kitkat: {
    top: [
      'Kit Kat at number one. You enjoy candy that comes with instructions.',
      'Kit Kat first. You snap it into sticks, every time, like a professional.',
      'You ranked Kit Kat first, the candy that is mostly wafer and you are fine with it.',
    ],
    last: [
      'Kit Kat dead last. You took the break and never came back.',
      'Kit Kat in last place. The wafer did nothing wrong.',
      'Last place for Kit Kat means you have bitten straight across one, and you know what you did.',
    ],
  },
  twix: {
    top: [
      'Twix at number one. Left Twix or right Twix? We know you have an answer.',
      'Twix first. You are a cookie person disguised as a candy person.',
      'You ranked Twix first, which means you share one stick and keep the other.',
    ],
    last: [
      'Twix in last place. Neither left nor right could win you over.',
      'Twix dead last. A cookie and caramel walked in and you said no.',
      'Last place for Twix. Both sticks, rejected equally.',
    ],
  },
  mms: {
    top: [
      'M&M\'s first. You have sorted them by colour at least once in your life.',
      'M&M\'s at number one, the candy you can eat one at a time and still finish the bag.',
      'You ranked M&M\'s first, and you definitely have a favourite colour of a thing that tastes the same.',
    ],
    last: [
      'M&M\'s in last place. Little chocolate buttons, unloved.',
      'M&M\'s dead last. Melts in your mouth, not in your heart.',
      'Last place for M&M\'s. They are just going to roll under the couch now.',
    ],
  },
  skittles: {
    top: [
      'Skittles at number one. You pick out your favourite colours first, admit it.',
      'Skittles first. You enjoy candy that is mostly a colour.',
      'You ranked Skittles first, so you have eaten a whole handful at once to see what happens.',
    ],
    last: [
      'Skittles dead last. You tasted the rainbow and sent it back.',
      'Skittles in last place. Too many flavours, not enough chocolate.',
      'Last place for Skittles, so you trade away a rainbow every Halloween.',
    ],
  },
  starburst: {
    top: [
      'Starburst at number one. Pink is the best one and we both know it.',
      'Starburst first. You have unwrapped one with your teeth, like a raccoon.',
      'You ranked Starburst first, the candy that is mostly unwrapping.',
    ],
    last: [
      'Starburst in last place. All that unwrapping for a fruit square.',
      'Starburst dead last. Even the pink ones? Even the pink ones.',
      'Last place for Starburst. Those wrappers are tiny and you are done with them.',
    ],
  },
  jolly: {
    top: [
      'Jolly Ranchers at number one. You enjoy candy that lasts longer than a movie.',
      'Jolly Ranchers first. Blue raspberry, probably, which is not a real fruit.',
      'You ranked Jolly Ranchers first, so you are patient, or you bite them. Both are concerning.',
    ],
    last: [
      'Jolly Ranchers in last place. Not so jolly now.',
      'Jolly Ranchers dead last, the candy grandparents keep in a bowl forever.',
      'Last place for Jolly Ranchers. They will be in that bucket until spring.',
    ],
  },
  sourpatch: {
    top: [
      'Sour Patch Kids at number one. First they are sour, then they are your favourite.',
      'Sour Patch Kids first. You like candy that fights back a little.',
      'You ranked Sour Patch Kids first, so your tongue has been through a lot.',
    ],
    last: [
      'Sour Patch Kids in last place. They were sour, then they were sweet, then they were gone.',
      'Sour Patch Kids dead last. The kids are not alright.',
      'Last place for Sour Patch Kids. Too much drama for one candy.',
    ],
  },
  nerds: {
    top: [
      'Nerds at number one. You eat candy by the thousand.',
      'Nerds first. You pour them straight into your mouth from the box.',
      'You ranked Nerds first, the only candy you can drop and still have most of.',
    ],
    last: [
      'Nerds in last place. Tiny pebbles of sugar, rejected.',
      'Nerds dead last. You can never get the last ones out of the box anyway.',
      'Last place for Nerds. They will be in the car seat cushions forever regardless.',
    ],
  },
  candycorn: {
    top: [
      'Candy corn at number one? You are either a genius or a scarecrow.',
      'Candy corn first. The most divisive candy in America and you picked a side.',
      'You ranked candy corn first, and we are going to need a moment.',
    ],
    last: [
      'Candy corn in last place, along with most of the planet.',
      'Candy corn dead last. It tastes like a candle and you said so.',
      'Last place for candy corn is the most popular opinion you will ever have.',
    ],
  },
  tootsie: {
    top: [
      'Tootsie Rolls at number one. You are the reason they are still made.',
      'Tootsie Rolls first. Chocolate-ish, chewy-ish, and loved by you specifically.',
      'You ranked Tootsie Rolls first, which is the most surprising sentence we have written today.',
    ],
    last: [
      'Tootsie Rolls in last place. The bottom of the bucket is where they live.',
      'Tootsie Rolls dead last. Every year they show up, every year nobody asks.',
      'Last place for Tootsie Rolls. Even the wrapper looks resigned.',
    ],
  },

  // ---- Christmas cookies ----
  sugar: {
    top: [
      'Frosted sugar cookies first. You judge cookies by how good the sprinkles look.',
      'Sugar cookies at number one. Mostly frosting, entirely joy.',
      'You ranked sugar cookies first, so you have eaten the snowman\'s head first.',
    ],
    last: [
      'Sugar cookies in last place. All that decorating, for nothing.',
      'Sugar cookies dead last. Somebody spent two hours on that frosting.',
      'Last place for sugar cookies. The sprinkles are on the floor anyway.',
    ],
  },
  gingerbread: {
    top: [
      'Gingerbread first. You bite the head off first, and you do it with eye contact.',
      'Gingerbread at number one. You like your cookies spicy and shaped like people.',
      'You ranked gingerbread first, which means you think the house is for eating.',
    ],
    last: [
      'Gingerbread dead last. Run, run, as fast as you can.',
      'Gingerbread in last place. The little guys will hold a grudge.',
      'Last place for gingerbread. Strong decorations, weak cookie.',
    ],
  },
  chocchip: {
    top: [
      'Chocolate chip first. A classic choice from a person who does not take chances.',
      'Chocolate chip at number one. The cookie equivalent of a nice sweater.',
      'You ranked chocolate chip first, so you have eaten the dough and you are not sorry.',
    ],
    last: [
      'Chocolate chip in last place. The most famous cookie in the world, and you said no.',
      'Chocolate chip dead last is the hottest take in the cookie tin.',
      'Last place for chocolate chip. Bold. Strange. But bold.',
    ],
  },
  snickerdoodle: {
    top: [
      'Snickerdoodles first. You picked the cookie with the best name, which is fair.',
      'Snickerdoodles at number one. Cinnamon sugar is a personality trait.',
      'You ranked snickerdoodles first, so you have explained what a snickerdoodle is many times.',
    ],
    last: [
      'Snickerdoodles in last place. The name was doing all the work.',
      'Snickerdoodles dead last. Just a sugar cookie in a cinnamon coat.',
      'Last place for snickerdoodles. Nobody can say it seriously anyway.',
    ],
  },
  pbblossom: {
    top: [
      'Peanut butter blossoms first. You eat the chocolate kiss off the top separately.',
      'Peanut butter blossoms at number one, the cookie with a built-in hat.',
      'You ranked peanut butter blossoms first, which means the kiss goes in last for you too.',
    ],
    last: [
      'Peanut butter blossoms in last place. Even with a chocolate kiss on top.',
      'Peanut butter blossoms dead last. The little kiss could not save it.',
      'Last place for peanut butter blossoms. A kiss, rejected.',
    ],
  },
  shortbread: {
    top: [
      'Shortbread first. Butter, sugar, flour, and you think that is the perfect amount of things.',
      'Shortbread at number one. You like a cookie that comes in a tin with a plaid lid.',
      'You ranked shortbread first, which means you think frosting is showing off.',
    ],
    last: [
      'Shortbread in last place. Too plain, too buttery, too Scottish for you.',
      'Shortbread dead last. The tin will now be used for sewing supplies.',
      'Last place for shortbread. It was mostly butter and still not enough.',
    ],
  },
  thumbprint: {
    top: [
      'Jam thumbprints first. You trust a cookie with a fingerprint on it.',
      'Jam thumbprints at number one. Fancy, fruity, and a little bit sticky.',
      'You ranked jam thumbprints first, so you go straight for the middle bite.',
    ],
    last: [
      'Jam thumbprints in last place. Fruit does not belong in your cookie tin.',
      'Jam thumbprints dead last. Somebody pressed that thumb in with love.',
      'Last place for jam thumbprints. Too sticky to forgive.',
    ],
  },
  snowball: {
    top: [
      'Snowball cookies first. You enjoy wearing your dessert on your shirt.',
      'Snowball cookies at number one. Powdered sugar everywhere and no regrets.',
      'You ranked snowballs first, which means you have breathed in at the wrong moment.',
    ],
    last: [
      'Snowball cookies in last place. Too much powdered sugar, not enough reasons.',
      'Snowballs dead last. Your dark sweater is relieved.',
      'Last place for snowball cookies. A cookie that makes you cough is a choice.',
    ],
  },
  crinkle: {
    top: [
      'Chocolate crinkles first. A brownie that dressed up as a cookie.',
      'Chocolate crinkles at number one. Cracked on the outside, gooey in the middle, like the holidays.',
      'You ranked chocolate crinkles first, so you have opinions about fudgy versus cakey.',
    ],
    last: [
      'Chocolate crinkles in last place. You looked at chocolate and powdered sugar and passed.',
      'Chocolate crinkles dead last. They looked so fancy, too.',
      'Last place for crinkles. All crack, no reward.',
    ],
  },
  spritz: {
    top: [
      'Spritz cookies first. You like your cookies shaped like tiny trees with sprinkles.',
      'Spritz cookies at number one. Somebody owns a cookie press and it is you.',
      'You ranked spritz first, which means you eat them by the handful.',
    ],
    last: [
      'Spritz cookies in last place. All shape, no story.',
      'Spritz dead last. Tiny green trees, tiny disappointment.',
      'Last place for spritz cookies. The cookie press is going back in the closet.',
    ],
  },
  oatmeal: {
    top: [
      'Oatmeal raisin at number one? Are you sure you didn\'t mean chocolate chip?',
      'Oatmeal raisin first. Somebody had to defend it, and that somebody is you.',
      'You ranked oatmeal raisin first, and the raisins are throwing you a party.',
    ],
    last: [
      'Oatmeal raisin in last place, along with every child who mistook it for chocolate chip.',
      'Oatmeal raisin dead last, the most popular opinion in the cookie tin.',
      'Last place for oatmeal raisin. The raisins knew this was coming.',
    ],
  },
  macaroon: {
    top: [
      'Coconut macaroons first. You like a cookie that is basically a little haystack.',
      'Macaroons at number one. Coconut people are a small but loyal group.',
      'You ranked coconut macaroons first, a choice the rest of the family will happily allow.',
    ],
    last: [
      'Coconut macaroons in last place. Coconut is a texture, not a flavour, apparently.',
      'Macaroons dead last. Too chewy, too coconutty, too many decisions.',
      'Last place for macaroons. The coconut fans will keep them all.',
    ],
  },
};

// Extra lines for each type, on top of the one in data.js.
export const TYPE_LINES = {
  main: [
    'You think of the side dishes as background characters.',
    'You would carve the turkey yourself if they let you.',
  ],
  carb: [
    'Your plate is ninety percent carbohydrates and one hundred percent happiness.',
    'You could survive on bread and potatoes alone, and you might.',
  ],
  veg: [
    'You think vegetables count as a holiday food. Brave of you.',
    'Your plate has colours other than beige, which is suspicious.',
  ],
  sweet: [
    'Your plate is basically a dessert buffet with a bit of turkey for appearances.',
    'You think marshmallows go on everything and frankly we have no counterargument.',
  ],
  choc: [
    'You check every wrapper for chocolate before committing.',
    'Fruit candy is just a waste of a trick-or-treat to you.',
  ],
  fruity: [
    'Your candy is mostly colours and you love it that way.',
    'You hold strong opinions about which flavour is the best one.',
  ],
  sour: [
    'Your favourite candy makes your face do something weird, on purpose.',
    'You like your sugar with a little bit of pain.',
  ],
  oldschool: [
    'You like the candy everyone else trades away, which makes trading easy.',
    'Your bucket at the end of the night looks like your grandparents\' candy dish.',
  ],
  chocolate: [
    'You inspect every cookie for chocolate before taking a bite.',
    'A cookie without chocolate is just a cracker with ambition, to you.',
  ],
  classic: [
    'You like a cookie that looks like a decoration first and a snack second.',
    'You want cookies that look like they came out of a holiday movie.',
  ],
  butter: [
    'Your favourite cookies are quietly made of mostly butter.',
    'You like the plain cookies, which are secretly the best ones.',
  ],
  wild: [
    'You go for the cookies that everyone else leaves on the plate.',
    'Your cookie choices are strange, and the plate is better for it.',
  ],
};

// Openers for a hot take, where {a} is ranked surprisingly above {b}.
export const TAKE_LINES = [
  '{a} above {b}? Bold. Wrong, but bold.',
  'You put {a} above {b}. Seek help.',
  '{a} over {b} is a choice people will remember.',
  '{a} above {b}? Somebody check on this person.',
  'Ranking {a} above {b} is the kind of thing that starts family arguments.',
  'You looked at {b}, then looked at {a}, and picked wrong.',
  '{a} beating {b} is the upset of the season.',
  'We need to talk about {a} being above {b}.',
  'Putting {a} over {b} takes courage, or confusion.',
  '{b} below {a}? {b} deserves an apology.',
];

// Openers when there is no hot take; {top} is their #1.
export const NORMAL_LINES = [
  '{top} at number one. Suspiciously normal. No hot takes detected.',
  'A ranking so sensible it could run for office.',
  'Your ranking is so reasonable we almost do not trust it.',
  'No hot takes here. You are the person everyone agrees with, which is annoying.',
  '{top} first and everything else in a perfectly sensible order. Boring, but correct.',
];

// For lists people make themselves, where we know nothing about the items.
export const CUSTOM_TOP = [
  '{top} at number one, and you said it with your whole chest.',
  '{top} first. You did not even hesitate, did you?',
  'Out of everything here you picked {top}, and we respect the commitment.',
  '{top} on top. Bold. Possibly correct.',
  'You put {top} first like it was obvious. It was not obvious.',
];
export const CUSTOM_LAST = [
  'And {last} dead last? Somebody\'s feelings are hurt.',
  '{last} in last place will be brought up at the next family dinner.',
  'Justice for {last}.',
  '{last} came last, and {last} will remember this.',
  'Poor {last}. Never stood a chance.',
  'Last place for {last}. Somebody, somewhere, is heartbroken.',
];
