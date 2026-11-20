// Categories are plain data: add a new one here and the whole app picks it up.
//
// IMPORTANT: share links store a ranking as item positions in `items`.
// Never reorder or remove items in a live category; only append new ones.
//
// `consensus` is a hand-written guess at the crowd ranking, used to find a
// person's "hot take". Replace it with real aggregate data once there is some.

export const CATEGORIES = [
  {
    id: 'thanksgiving',
    code: 't',
    title: 'Thanksgiving Plate',
    emoji: '🦃',
    badge: 'In season',
    blurb: 'Turkey, sides and pie. Settle the family argument.',
    theme: { bg: '#FFF4E3', card: '#FFFFFF', accent: '#C2410C', accent2: '#F59E0B', ink: '#3B1F0B' },
    items: [
      { id: 'turkey', name: 'Turkey', emoji: '🦃', group: 'main' },
      { id: 'stuffing', name: 'Stuffing', emoji: '🥘', group: 'carb' },
      { id: 'mashed', name: 'Mashed Potatoes', emoji: '🥔', group: 'carb' },
      { id: 'gravy', name: 'Gravy', emoji: '🥣', group: 'main' },
      { id: 'cranberry', name: 'Cranberry Sauce', emoji: '🍒', group: 'sweet' },
      { id: 'greenbean', name: 'Green Bean Casserole', emoji: '🫛', group: 'veg' },
      { id: 'sweetpotato', name: 'Sweet Potato Casserole', emoji: '🍠', group: 'sweet' },
      { id: 'mac', name: 'Mac & Cheese', emoji: '🧀', group: 'carb' },
      { id: 'rolls', name: 'Dinner Rolls', emoji: '🥖', group: 'carb' },
      { id: 'corn', name: 'Corn', emoji: '🌽', group: 'veg' },
      { id: 'brussels', name: 'Brussels Sprouts', emoji: '🥬', group: 'veg' },
      { id: 'pie', name: 'Pumpkin Pie', emoji: '🥧', group: 'sweet' },
    ],
    consensus: ['mashed', 'stuffing', 'turkey', 'mac', 'gravy', 'rolls', 'pie', 'sweetpotato', 'corn', 'greenbean', 'cranberry', 'brussels'],
    groups: {
      main: { label: 'Turkey Traditionalist', emoji: '🦃', line: 'You are here for the bird and the gravy. The sides are just witnesses.' },
      carb: { label: 'Carb Loyalist', emoji: '🥔', line: 'Your ideal plate is four shades of beige and you have never been happier.' },
      veg: { label: 'Veggie Diplomat', emoji: '🥬', line: 'Someone has to eat the vegetables. Apparently you volunteered.' },
      sweet: { label: 'Dessert-First Rebel', emoji: '🥧', line: 'You treat dinner as the opening act for pie.' },
    },
  },
  {
    id: 'halloween',
    code: 'h',
    title: 'Halloween Candy',
    emoji: '🎃',
    badge: 'Classic',
    blurb: 'The trick-or-treat bucket, ranked once and for all.',
    theme: { bg: '#F6EEFF', card: '#FFFFFF', accent: '#6D28D9', accent2: '#F97316', ink: '#24103F' },
    items: [
      { id: 'reeses', name: "Reese's Cups", emoji: '🥜', group: 'choc' },
      { id: 'snickers', name: 'Snickers', emoji: '🍫', group: 'choc' },
      { id: 'kitkat', name: 'Kit Kat', emoji: '🧇', group: 'choc' },
      { id: 'twix', name: 'Twix', emoji: '🍪', group: 'choc' },
      { id: 'mms', name: "M&M's", emoji: '🟡', group: 'choc' },
      { id: 'skittles', name: 'Skittles', emoji: '🌈', group: 'fruity' },
      { id: 'starburst', name: 'Starburst', emoji: '⭐', group: 'fruity' },
      { id: 'jolly', name: 'Jolly Ranchers', emoji: '🍬', group: 'fruity' },
      { id: 'sourpatch', name: 'Sour Patch Kids', emoji: '😝', group: 'sour' },
      { id: 'nerds', name: 'Nerds', emoji: '🤓', group: 'sour' },
      { id: 'candycorn', name: 'Candy Corn', emoji: '🌽', group: 'oldschool' },
      { id: 'tootsie', name: 'Tootsie Rolls', emoji: '🟤', group: 'oldschool' },
    ],
    consensus: ['reeses', 'snickers', 'kitkat', 'twix', 'mms', 'sourpatch', 'skittles', 'starburst', 'nerds', 'jolly', 'tootsie', 'candycorn'],
    groups: {
      choc: { label: 'Chocolate Purist', emoji: '🍫', line: "If it isn't chocolate, it's packaging." },
      fruity: { label: 'Fruit Chew Fiend', emoji: '🌈', line: 'Your dentist knows you by name and by wrapper.' },
      sour: { label: 'Sour Goblin', emoji: '😝', line: 'You enjoy candy that fights back.' },
      oldschool: { label: 'Old-School Soul', emoji: '🌽', line: 'You have the candy taste of a kindly grandparent, and we respect it.' },
    },
  },
  {
    id: 'cookies',
    code: 'c',
    title: 'Christmas Cookies',
    emoji: '🍪',
    badge: 'Coming up',
    blurb: 'The cookie tin, ranked. Somebody has to defend oatmeal raisin.',
    theme: { bg: '#F2F7F0', card: '#FFFFFF', accent: '#B91C1C', accent2: '#EF4444', ink: '#14301F' },
    items: [
      { id: 'sugar', name: 'Frosted Sugar Cookies', emoji: '❄️', group: 'classic' },
      { id: 'gingerbread', name: 'Gingerbread', emoji: '🤎', group: 'classic' },
      { id: 'chocchip', name: 'Chocolate Chip', emoji: '🍪', group: 'chocolate' },
      { id: 'snickerdoodle', name: 'Snickerdoodles', emoji: '🟠', group: 'butter' },
      { id: 'pbblossom', name: 'Peanut Butter Blossoms', emoji: '🥜', group: 'chocolate' },
      { id: 'shortbread', name: 'Shortbread', emoji: '🧈', group: 'butter' },
      { id: 'thumbprint', name: 'Jam Thumbprints', emoji: '🍓', group: 'wild' },
      { id: 'snowball', name: 'Snowball Cookies', emoji: '⛄', group: 'butter' },
      { id: 'crinkle', name: 'Chocolate Crinkles', emoji: '🍫', group: 'chocolate' },
      { id: 'spritz', name: 'Spritz Cookies', emoji: '🎄', group: 'classic' },
      { id: 'oatmeal', name: 'Oatmeal Raisin', emoji: '🍇', group: 'wild' },
      { id: 'macaroon', name: 'Coconut Macaroons', emoji: '🥥', group: 'wild' },
    ],
    consensus: ['chocchip', 'sugar', 'pbblossom', 'snickerdoodle', 'gingerbread', 'shortbread', 'crinkle', 'snowball', 'thumbprint', 'spritz', 'macaroon', 'oatmeal'],
    groups: {
      classic: { label: 'Cookie-Cutter Classicist', emoji: '🎄', line: 'If it does not come in the shape of a tree, you are not interested.' },
      chocolate: { label: 'Chocolate Seeker', emoji: '🍫', line: 'You check every cookie for chocolate before committing.' },
      butter: { label: 'Butter Believer', emoji: '🧈', line: 'Plain to the untrained eye. You know better.' },
      wild: { label: 'Cookie Tin Rebel', emoji: '🥥', line: 'You reach for the cookies everyone else leaves behind, on purpose.' },
    },
  },
];

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id) || null;
export const getCategoryByCode = (code) => CATEGORIES.find((c) => c.code === code) || null;
export const getItem = (cat, id) => cat.items.find((i) => i.id === id) || null;
