// Single source of truth for the towns served. Both the header marquee
// (sections/header.html) and the service-area section (index.html) read from
// this, so the two lists can't drift apart. Add/remove towns here only.
module.exports = {
    // the home base — gets the highlighted pill in the service-area list
    home: "Richmond Beach",
    towns: [
        "Shoreline",
        "Richmond Beach",
        "Edmonds",
        "Lynnwood",
        "Seattle",
        "Kirkland",
        "Bellevue",
        "Bainbridge Island",
        "Kingston",
    ],
};
