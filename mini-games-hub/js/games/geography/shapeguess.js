// Country Shape Guess Game
// Guess the country from its silhouette outline. 4 choices, 12s timer, 3 lives, streak bonus.

const COUNTRIES = [
    {
        name: "Italy",
        points: [[48,0],[52,2],[56,8],[54,14],[58,18],[62,16],[66,20],[62,26],[56,28],[54,34],[58,42],[60,50],[56,58],[50,64],[46,70],[48,76],[52,82],[50,88],[46,94],[42,98],[38,100],[40,92],[44,86],[42,78],[38,72],[34,68],[30,74],[28,80],[32,86],[28,82],[24,76],[26,70],[30,64],[34,58],[36,50],[38,42],[40,34],[42,28],[38,22],[36,16],[40,10],[44,4]]
    },
    {
        name: "Japan",
        points: [[60,0],[64,6],[66,14],[68,22],[72,28],[74,36],[70,42],[66,48],[62,54],[58,60],[54,66],[50,72],[46,78],[42,84],[38,90],[34,96],[30,100],[28,94],[32,88],[36,82],[40,76],[44,70],[48,64],[52,58],[56,50],[54,44],[50,38],[46,32],[48,26],[52,20],[56,14],[58,8]]
    },
    {
        name: "Australia",
        points: [[30,8],[38,4],[46,2],[54,0],[62,2],[70,4],[78,8],[84,14],[88,22],[90,30],[92,38],[94,46],[96,54],[98,62],[100,70],[96,76],[90,80],[84,84],[78,88],[72,92],[66,96],[60,100],[54,96],[48,92],[42,88],[36,84],[30,80],[24,76],[18,72],[14,66],[10,58],[8,50],[6,42],[8,34],[12,26],[16,20],[20,14],[24,10]]
    },
    {
        name: "India",
        points: [[44,0],[50,2],[56,4],[60,8],[62,14],[64,20],[66,26],[68,32],[70,38],[72,44],[74,50],[72,56],[68,62],[64,68],[60,74],[56,80],[52,86],[50,92],[48,98],[46,100],[44,94],[42,88],[40,82],[38,76],[36,70],[34,64],[32,58],[30,52],[28,46],[26,40],[28,34],[30,28],[32,22],[34,16],[36,10],[40,4]]
    },
    {
        name: "Brazil",
        points: [[36,0],[44,2],[52,6],[60,10],[66,8],[72,12],[78,16],[82,22],[84,28],[80,34],[76,40],[78,46],[80,52],[82,58],[78,64],[74,70],[70,76],[64,82],[58,88],[52,94],[46,100],[40,96],[34,90],[28,84],[22,78],[18,72],[14,66],[12,60],[14,54],[16,48],[18,42],[20,36],[22,30],[24,24],[26,18],[28,12],[32,6]]
    },
    {
        name: "United States",
        points: [[0,28],[6,26],[12,24],[18,22],[24,20],[30,22],[36,24],[42,22],[48,20],[54,18],[60,16],[66,18],[72,20],[78,22],[84,24],[90,26],[96,28],[100,32],[98,38],[94,42],[90,44],[86,48],[82,52],[78,56],[72,58],[66,56],[60,54],[54,56],[48,58],[42,60],[36,62],[30,64],[24,66],[18,68],[12,70],[8,66],[4,60],[2,54],[0,48],[2,38]]
    },
    {
        name: "United Kingdom",
        points: [[40,0],[46,4],[50,10],[54,16],[52,22],[48,28],[52,34],[56,38],[54,44],[50,50],[46,56],[48,62],[52,68],[50,74],[46,80],[42,86],[38,92],[36,98],[34,100],[30,94],[28,88],[32,82],[36,76],[38,70],[34,64],[30,58],[32,52],[36,46],[40,40],[38,34],[34,28],[36,22],[38,16],[36,10]]
    },
    {
        name: "France",
        points: [[30,0],[40,2],[50,4],[58,8],[64,14],[68,22],[72,30],[74,38],[70,46],[66,54],[62,60],[58,66],[52,72],[46,78],[40,84],[34,90],[28,96],[22,100],[18,94],[16,86],[14,78],[16,70],[20,62],[24,54],[22,46],[18,38],[16,30],[18,22],[22,14],[26,8]]
    },
    {
        name: "China",
        points: [[20,10],[28,6],[36,4],[44,2],[52,0],[60,4],[68,8],[74,14],[80,20],[86,26],[90,32],[94,38],[96,44],[100,50],[96,56],[90,60],[84,58],[78,54],[72,52],[66,56],[60,62],[54,68],[48,74],[42,78],[36,82],[30,86],[24,90],[18,94],[12,100],[8,94],[4,86],[2,78],[4,70],[6,62],[8,54],[10,46],[12,38],[14,30],[16,22]]
    },
    {
        name: "Russia",
        points: [[0,40],[8,36],[16,32],[24,28],[32,24],[40,22],[48,20],[56,18],[64,16],[72,18],[80,20],[88,22],[96,26],[100,30],[98,36],[94,42],[88,46],[82,50],[76,54],[70,58],[64,62],[58,60],[52,56],[46,54],[40,58],[34,62],[28,66],[22,70],[16,74],[10,78],[6,82],[4,76],[2,68],[0,60],[2,50]]
    },
    {
        name: "Mexico",
        points: [[10,0],[18,2],[26,4],[34,6],[42,4],[50,2],[58,6],[64,12],[68,20],[72,28],[78,36],[82,44],[86,52],[90,60],[94,68],[100,76],[96,80],[90,78],[84,74],[78,70],[72,66],[66,62],[60,58],[54,54],[48,50],[42,46],[36,42],[30,38],[24,42],[18,48],[12,54],[6,60],[2,56],[0,48],[2,40],[4,32],[6,24],[8,16],[6,8]]
    },
    {
        name: "Chile",
        points: [[40,0],[44,4],[46,10],[48,16],[46,22],[44,28],[46,34],[48,40],[46,46],[44,52],[46,58],[48,64],[46,70],[44,76],[46,82],[48,88],[46,94],[44,100],[40,98],[38,92],[36,86],[38,80],[40,74],[38,68],[36,62],[38,56],[40,50],[38,44],[36,38],[38,32],[40,26],[38,20],[36,14],[38,8]]
    },
    {
        name: "Norway",
        points: [[50,0],[56,6],[60,14],[58,22],[54,30],[52,38],[54,46],[56,54],[52,62],[48,70],[46,78],[44,86],[42,94],[40,100],[36,96],[34,90],[32,84],[34,78],[38,72],[42,66],[44,58],[42,50],[38,44],[36,38],[38,32],[42,26],[44,20],[42,14],[44,8]]
    },
    {
        name: "Sweden",
        points: [[44,0],[50,4],[54,10],[56,18],[54,26],[52,34],[56,40],[58,48],[56,56],[52,64],[50,72],[48,80],[46,88],[44,96],[42,100],[38,94],[36,86],[38,78],[40,70],[42,62],[40,54],[36,48],[34,42],[36,36],[40,30],[42,24],[40,18],[38,12],[40,6]]
    },
    {
        name: "Finland",
        points: [[42,0],[48,4],[52,10],[56,18],[58,26],[56,34],[54,42],[56,50],[58,58],[56,66],[54,74],[52,82],[50,90],[48,98],[46,100],[42,94],[40,86],[38,78],[36,70],[34,62],[36,54],[38,46],[36,38],[34,30],[36,22],[38,14],[40,8]]
    },
    {
        name: "Turkey",
        points: [[0,36],[8,30],[16,28],[24,26],[32,28],[40,26],[48,28],[56,30],[64,28],[72,30],[80,32],[88,36],[96,40],[100,44],[96,48],[88,52],[80,54],[72,56],[64,58],[56,56],[48,54],[40,56],[32,54],[24,52],[16,50],[8,48],[2,44]]
    },
    {
        name: "Saudi Arabia",
        points: [[20,0],[30,4],[40,8],[50,6],[60,10],[70,16],[80,22],[88,30],[94,40],[100,50],[94,58],[86,64],[78,70],[70,76],[62,82],[54,88],[46,94],[38,100],[30,96],[22,90],[16,82],[10,74],[6,64],[4,54],[2,44],[4,34],[8,24],[12,16],[16,8]]
    },
    {
        name: "Egypt",
        points: [[14,0],[24,2],[34,4],[44,4],[54,4],[64,6],[74,8],[84,10],[90,16],[94,24],[96,34],[100,44],[96,52],[90,58],[82,62],[74,66],[66,72],[58,78],[50,84],[42,90],[34,96],[28,100],[22,96],[16,90],[12,82],[8,74],[4,64],[2,54],[4,44],[6,34],[8,24],[10,14]]
    },
    {
        name: "South Africa",
        points: [[18,0],[28,2],[38,4],[48,4],[58,4],[68,6],[78,10],[86,16],[92,24],[96,34],[100,44],[98,54],[94,64],[88,72],[80,78],[72,84],[64,90],[56,94],[48,98],[40,100],[32,98],[24,94],[18,88],[12,80],[8,72],[4,62],[2,52],[4,42],[8,32],[12,22],[14,12]]
    },
    {
        name: "Indonesia",
        points: [[0,40],[6,36],[14,34],[22,32],[30,34],[38,36],[46,34],[54,32],[62,34],[70,36],[78,38],[86,40],[94,42],[100,44],[96,48],[88,50],[80,52],[72,50],[64,48],[56,50],[48,52],[40,50],[32,48],[24,50],[16,48],[8,46],[2,44]]
    },
    {
        name: "Philippines",
        points: [[44,0],[50,6],[54,14],[52,22],[48,28],[52,34],[56,42],[54,50],[50,58],[46,64],[48,70],[52,78],[50,86],[46,92],[42,98],[40,100],[36,94],[34,86],[38,80],[42,74],[40,68],[36,62],[38,56],[42,50],[44,44],[40,38],[36,32],[38,26],[42,20],[46,14],[44,8]]
    },
    {
        name: "New Zealand",
        points: [[52,0],[58,6],[62,14],[60,22],[56,30],[52,36],[54,42],[58,48],[56,54],[52,60],[48,66],[44,72],[46,78],[50,84],[48,90],[44,96],[40,100],[36,94],[34,88],[38,82],[42,76],[40,70],[36,64],[38,58],[42,52],[46,46],[44,40],[40,34],[42,28],[46,22],[48,16],[50,10]]
    },
    {
        name: "Argentina",
        points: [[36,0],[44,2],[52,6],[58,12],[62,20],[64,28],[60,36],[56,42],[58,48],[62,54],[60,62],[56,68],[52,74],[48,80],[44,86],[40,92],[36,98],[34,100],[30,94],[28,86],[32,80],[36,74],[38,68],[36,62],[32,56],[30,50],[32,44],[36,38],[34,32],[30,26],[28,20],[30,14],[32,8]]
    },
    {
        name: "Colombia",
        points: [[22,0],[30,4],[38,8],[46,6],[54,10],[62,16],[68,24],[72,32],[74,40],[70,48],[64,54],[58,58],[52,62],[46,66],[40,70],[34,74],[28,78],[22,82],[16,78],[12,72],[8,64],[6,56],[4,48],[6,40],[10,32],[14,24],[18,16],[20,8]]
    },
    {
        name: "Spain",
        points: [[8,20],[16,14],[24,10],[32,8],[40,6],[48,4],[56,6],[64,8],[72,10],[80,14],[88,20],[94,28],[98,36],[100,44],[96,52],[90,58],[82,64],[74,68],[66,72],[58,76],[50,78],[42,76],[34,72],[26,68],[18,64],[12,58],[6,52],[2,44],[0,36],[4,28]]
    },
    {
        name: "Germany",
        points: [[30,0],[40,2],[50,4],[58,8],[64,14],[68,22],[70,32],[72,42],[70,52],[66,60],[60,68],[54,74],[48,80],[42,86],[36,90],[30,94],[24,100],[20,94],[18,86],[16,78],[18,70],[22,62],[24,54],[22,46],[18,38],[16,30],[18,22],[22,14],[26,8]]
    },
    {
        name: "Thailand",
        points: [[30,0],[38,4],[46,8],[52,14],[56,22],[58,30],[54,38],[48,44],[44,50],[46,56],[50,62],[52,70],[48,78],[44,84],[40,90],[36,96],[34,100],[30,96],[28,90],[32,84],[36,78],[38,72],[36,66],[32,60],[28,54],[30,48],[34,42],[38,36],[40,30],[36,24],[32,18],[28,12],[26,6]]
    },
    {
        name: "Vietnam",
        points: [[38,0],[44,6],[48,14],[50,22],[46,30],[42,38],[44,46],[48,54],[52,62],[48,70],[44,76],[46,82],[50,88],[48,94],[44,100],[40,96],[36,90],[34,84],[38,78],[42,72],[40,66],[36,60],[32,54],[34,48],[38,42],[40,36],[36,30],[34,24],[36,18],[38,12]]
    },
    {
        name: "South Korea",
        points: [[36,0],[44,4],[52,10],[58,18],[62,28],[64,38],[62,48],[58,56],[52,64],[46,72],[40,80],[36,88],[34,96],[32,100],[28,94],[26,86],[28,78],[32,70],[36,62],[38,54],[36,46],[32,38],[30,30],[32,22],[34,14],[34,8]]
    },
    {
        name: "Pakistan",
        points: [[16,10],[24,6],[32,2],[40,0],[48,4],[56,10],[64,16],[70,24],[76,32],[80,40],[84,48],[88,56],[92,64],[96,72],[100,80],[94,84],[86,82],[78,78],[70,74],[62,70],[56,66],[50,68],[44,72],[38,76],[32,80],[26,84],[20,88],[14,92],[8,96],[4,100],[2,94],[4,86],[8,78],[10,70],[8,62],[6,54],[8,46],[10,38],[12,30],[14,20]]
    }
];

// Better distinctive shapes - override with more recognizable polygons
const COUNTRY_SHAPES = [
    {
        name: "Italy",
        // Boot shape
        polys: [[[42,0],[52,0],[56,5],[54,12],[50,15],[48,20],[50,26],[52,30],[50,36],[46,42],[48,48],[52,55],[54,60],[52,65],[48,70],[44,75],[40,82],[38,88],[42,92],[46,96],[44,100],[40,98],[36,94],[34,88],[36,82],[40,76],[44,70],[46,64],[44,58],[40,52],[38,46],[36,40],[34,34],[36,28],[38,22],[40,16],[38,10],[40,4]]]
    },
    {
        name: "Japan",
        // Archipelago - main island curve
        polys: [
            [[55,0],[60,5],[62,12],[60,20],[56,26],[54,32],[56,38],[60,44],[58,50],[54,55],[50,60],[48,66],[46,72],[44,78],[42,84],[40,90],[38,96],[36,100],[32,96],[34,90],[36,84],[38,78],[40,72],[42,66],[44,60],[48,54],[52,48],[50,42],[46,36],[48,30],[52,24],[54,18],[52,12],[50,6]],
            [[66,18],[70,22],[72,28],[70,34],[66,30],[64,24]]
        ]
    },
    {
        name: "Australia",
        polys: [[[32,10],[40,6],[48,4],[56,2],[64,4],[72,6],[80,10],[86,16],[90,24],[92,30],[90,38],[86,42],[90,48],[94,54],[96,60],[100,68],[96,74],[90,78],[84,82],[78,86],[72,90],[66,94],[60,98],[54,100],[48,96],[42,92],[36,88],[30,84],[26,78],[22,72],[18,66],[14,58],[12,50],[14,42],[18,36],[22,30],[26,24],[28,18]]]
    },
    {
        name: "India",
        // Triangle/peninsula shape
        polys: [[[30,0],[40,0],[50,2],[58,6],[64,12],[68,18],[70,24],[68,30],[64,34],[66,40],[70,46],[72,52],[70,58],[66,64],[62,70],[58,76],[54,82],[50,88],[48,94],[46,100],[44,94],[42,88],[38,82],[34,76],[30,70],[28,64],[26,58],[28,52],[32,46],[34,40],[32,34],[28,28],[26,22],[28,16],[26,10],[28,4]]]
    },
    {
        name: "Brazil",
        // Large blob, wider at top
        polys: [[[34,0],[42,2],[50,6],[58,10],[64,8],[70,12],[76,18],[82,24],[86,30],[84,38],[80,44],[82,50],[84,56],[82,62],[78,68],[74,74],[68,80],[62,86],[56,92],[50,98],[44,100],[38,96],[32,90],[26,84],[20,78],[16,72],[12,66],[10,60],[12,54],[14,48],[16,42],[18,36],[20,30],[22,24],[24,18],[28,12],[30,6]]]
    },
    {
        name: "United States",
        // Mainland - wide rectangle with indentations
        polys: [[[0,22],[8,18],[16,16],[24,18],[30,20],[36,18],[42,16],[48,18],[54,20],[60,18],[66,16],[72,18],[78,20],[84,22],[90,26],[96,30],[100,34],[98,40],[96,46],[92,50],[88,54],[84,58],[80,62],[76,66],[72,68],[66,64],[60,62],[54,64],[48,66],[42,68],[36,70],[30,72],[24,74],[18,76],[14,80],[10,78],[6,72],[4,66],[2,58],[0,50],[2,42],[0,34]]]
    },
    {
        name: "United Kingdom",
        // Island shape - Great Britain outline
        polys: [[[44,0],[50,4],[54,10],[52,16],[48,20],[50,26],[54,30],[56,36],[54,42],[50,46],[48,52],[50,58],[54,64],[52,70],[48,76],[44,82],[40,88],[38,94],[36,100],[32,96],[30,90],[34,84],[38,78],[40,72],[36,66],[32,60],[30,54],[32,48],[36,42],[40,36],[38,30],[34,24],[36,18],[38,12],[40,6]]]
    },
    {
        name: "France",
        // Hexagon-ish
        polys: [[[32,0],[42,2],[52,6],[60,12],[66,20],[70,30],[72,40],[70,50],[66,58],[60,66],[54,72],[48,78],[42,84],[36,88],[28,92],[22,96],[18,100],[14,94],[12,86],[14,78],[18,70],[22,62],[20,54],[16,46],[14,38],[16,30],[20,22],[24,14],[28,8]]]
    },
    {
        name: "China",
        // Large irregular shape
        polys: [[[18,12],[26,8],[34,4],[42,2],[50,0],[58,4],[66,10],[74,16],[80,22],[86,28],[92,34],[96,40],[100,48],[96,54],[90,58],[84,56],[78,52],[72,50],[66,54],[60,60],[54,66],[48,72],[42,76],[36,80],[30,84],[24,88],[18,92],[12,96],[8,100],[4,94],[2,86],[4,78],[6,70],[8,62],[10,54],[12,46],[14,38],[14,30],[16,22]]]
    },
    {
        name: "Russia",
        // Very wide, northern
        polys: [[[0,36],[8,30],[16,26],[24,22],[32,20],[40,18],[48,16],[56,14],[64,16],[72,18],[80,20],[88,24],[96,28],[100,34],[98,40],[94,46],[88,50],[82,54],[76,58],[70,62],[64,60],[58,56],[52,54],[46,52],[40,56],[34,60],[28,64],[22,68],[16,72],[10,76],[6,80],[4,74],[2,66],[0,58],[2,48]]]
    },
    {
        name: "Mexico",
        // Curved horn shape
        polys: [[[8,0],[16,2],[24,4],[32,6],[40,4],[48,2],[56,6],[62,12],[66,20],[70,28],[76,36],[80,44],[84,52],[88,60],[92,68],[96,76],[100,82],[96,86],[90,84],[84,80],[78,76],[72,72],[66,68],[60,64],[54,60],[48,56],[42,52],[36,48],[30,44],[26,48],[22,54],[18,60],[14,66],[10,72],[6,68],[4,60],[2,52],[0,44],[2,36],[4,28],[6,20],[6,10]]]
    },
    {
        name: "Chile",
        // Long thin strip
        polys: [[[44,0],[50,4],[52,10],[50,16],[48,22],[50,28],[52,34],[50,40],[48,46],[50,52],[52,58],[50,64],[48,70],[50,76],[52,82],[50,88],[48,94],[46,100],[42,98],[40,92],[38,86],[40,80],[42,74],[40,68],[38,62],[40,56],[42,50],[40,44],[38,38],[40,32],[42,26],[40,20],[38,14],[40,8]]]
    },
    {
        name: "Norway",
        // Long with fjords, narrow
        polys: [[[54,0],[60,6],[58,14],[54,20],[52,28],[54,36],[56,44],[54,52],[50,60],[48,68],[46,76],[44,84],[42,92],[40,100],[36,96],[34,88],[36,80],[40,72],[42,64],[44,56],[42,48],[38,42],[36,36],[38,30],[42,24],[44,18],[42,12],[44,6]]]
    },
    {
        name: "Sweden",
        polys: [[[46,0],[52,4],[56,10],[58,18],[56,26],[54,34],[58,40],[60,48],[58,56],[54,64],[52,72],[50,80],[48,88],[46,96],[44,100],[40,94],[38,86],[40,78],[42,70],[44,62],[42,54],[38,48],[36,42],[38,36],[42,30],[44,24],[42,18],[40,12],[42,6]]]
    },
    {
        name: "Finland",
        polys: [[[44,0],[50,4],[54,12],[58,20],[60,28],[58,36],[56,44],[58,52],[60,60],[58,68],[56,76],[54,84],[52,92],[50,100],[46,96],[42,88],[40,80],[38,72],[36,64],[38,56],[40,48],[38,40],[36,32],[38,24],[40,16],[42,8]]]
    },
    {
        name: "Turkey",
        // Wide horizontal, with bump on right (Anatolia)
        polys: [[[0,34],[8,28],[16,24],[24,22],[32,24],[40,22],[48,24],[56,26],[64,24],[72,26],[80,30],[88,36],[94,42],[100,48],[96,54],[88,58],[80,60],[72,62],[64,60],[56,58],[48,56],[40,58],[32,56],[24,54],[16,52],[8,50],[2,46],[0,40]]]
    },
    {
        name: "Saudi Arabia",
        // Large pentagon-ish
        polys: [[[22,0],[32,4],[42,8],[52,6],[62,10],[72,18],[80,26],[88,36],[94,46],[100,56],[94,64],[86,70],[78,76],[70,82],[62,88],[54,94],[46,100],[38,96],[30,90],[22,82],[16,74],[10,64],[6,54],[4,44],[6,34],[10,24],[14,16],[18,8]]]
    },
    {
        name: "Egypt",
        // Squarish with Sinai bump
        polys: [[[12,0],[22,2],[32,4],[42,4],[52,4],[62,4],[72,6],[80,10],[86,16],[90,24],[86,30],[82,28],[80,32],[84,38],[88,44],[92,52],[96,60],[100,68],[94,74],[86,78],[78,82],[70,86],[62,90],[54,94],[46,98],[40,100],[34,96],[28,90],[22,84],[16,78],[12,70],[8,62],[6,54],[4,46],[4,38],[6,30],[8,22],[10,14]]]
    },
    {
        name: "South Africa",
        // Wide, flat bottom
        polys: [[[16,0],[26,2],[36,4],[46,4],[56,4],[66,6],[76,10],[84,18],[90,26],[96,36],[100,46],[98,56],[94,66],[88,74],[80,80],[72,86],[64,92],[56,96],[48,100],[40,98],[32,94],[24,88],[18,82],[12,74],[8,66],[4,56],[2,46],[4,36],[8,26],[12,18],[14,10]]]
    },
    {
        name: "Indonesia",
        // Archipelago - long horizontal chain
        polys: [
            [[0,38],[8,34],[16,30],[24,32],[32,36],[36,42],[32,48],[24,50],[16,48],[8,46],[2,44]],
            [[40,32],[48,28],[56,30],[60,36],[56,42],[48,44],[42,40]],
            [[64,34],[72,30],[80,32],[84,38],[80,44],[72,46],[66,42]],
            [[86,36],[92,34],[98,38],[100,44],[96,48],[90,46],[86,42]]
        ]
    },
    {
        name: "Philippines",
        // Island chain, vertical
        polys: [
            [[42,0],[50,4],[54,10],[52,18],[48,22],[44,16],[40,8]],
            [[46,24],[54,28],[58,34],[56,42],[52,48],[48,44],[44,38],[42,32]],
            [[44,50],[52,54],[56,60],[54,68],[50,74],[46,70],[42,64],[40,58]],
            [[40,76],[48,80],[50,86],[48,92],[44,98],[40,100],[36,94],[38,88],[38,82]]
        ]
    },
    {
        name: "New Zealand",
        // Two islands
        polys: [
            [[52,0],[58,6],[62,14],[60,22],[56,28],[52,34],[48,40],[46,46],[44,50],[40,46],[42,40],[46,34],[50,28],[52,22],[54,16],[52,10],[50,4]],
            [[46,54],[52,58],[54,64],[52,72],[48,78],[44,84],[40,90],[38,96],[36,100],[32,96],[34,90],[38,84],[42,78],[44,72],[42,66],[40,60]]
        ]
    },
    {
        name: "Argentina",
        // Long, widening then narrowing
        polys: [[[34,0],[42,2],[50,6],[56,12],[60,20],[62,28],[58,34],[54,40],[56,46],[60,52],[58,60],[54,66],[50,72],[46,78],[42,84],[38,90],[36,96],[34,100],[30,96],[28,90],[30,84],[34,78],[38,72],[40,66],[38,60],[34,54],[30,48],[28,42],[30,36],[34,30],[32,24],[28,18],[26,12],[28,6]]]
    },
    {
        name: "Colombia",
        polys: [[[20,0],[28,4],[36,8],[44,6],[52,10],[60,16],[66,24],[70,32],[72,40],[68,48],[62,54],[56,58],[50,62],[44,66],[38,70],[32,74],[26,78],[20,82],[14,78],[10,70],[6,62],[4,54],[6,46],[10,38],[14,30],[18,22],[20,14],[20,6]]]
    },
    {
        name: "Spain",
        // Squarish peninsula
        polys: [[[10,16],[18,10],[26,6],[34,4],[42,2],[50,4],[58,6],[66,4],[74,8],[82,14],[88,22],[92,30],[96,38],[100,46],[96,54],[90,60],[84,66],[78,72],[72,76],[66,80],[58,84],[50,86],[42,84],[34,80],[26,76],[18,72],[12,66],[8,58],[4,50],[2,42],[4,34],[6,26]]]
    },
    {
        name: "Germany",
        polys: [[[32,0],[42,2],[52,6],[60,12],[66,20],[70,30],[72,40],[70,50],[66,60],[60,68],[54,74],[48,80],[42,86],[36,92],[30,96],[24,100],[20,94],[18,86],[16,78],[18,70],[22,62],[24,54],[22,46],[18,38],[16,30],[18,22],[22,14],[26,8]]]
    },
    {
        name: "Thailand",
        // Elephant head shape with trunk going south
        polys: [[[28,0],[36,4],[44,8],[50,14],[54,22],[56,30],[52,38],[46,42],[42,48],[44,54],[48,60],[50,68],[48,76],[44,82],[40,88],[36,94],[34,100],[30,96],[28,90],[32,84],[36,78],[38,72],[36,66],[32,60],[28,54],[30,48],[34,42],[38,36],[40,30],[36,24],[32,18],[28,12],[26,6]]]
    },
    {
        name: "Vietnam",
        // S-curve shape
        polys: [[[40,0],[46,6],[50,14],[52,22],[48,28],[44,34],[46,42],[50,50],[54,58],[52,66],[48,72],[50,80],[54,88],[52,94],[48,100],[44,96],[40,90],[38,84],[42,78],[44,72],[42,66],[38,60],[34,54],[36,48],[40,42],[42,36],[38,30],[36,24],[38,18],[40,12]]]
    },
    {
        name: "South Korea",
        // Rounded peninsula
        polys: [[[34,0],[42,4],[50,10],[56,18],[60,28],[62,38],[60,48],[56,58],[50,66],[44,74],[38,80],[34,86],[32,92],[30,100],[26,94],[24,86],[26,78],[30,70],[34,62],[36,54],[34,46],[30,38],[28,30],[30,22],[32,14],[32,8]]]
    },
    {
        name: "Pakistan",
        // Irregular with bump on east
        polys: [[[14,8],[22,4],[30,2],[38,0],[46,4],[54,10],[62,18],[68,26],[74,34],[78,42],[82,50],[86,58],[90,66],[94,74],[100,82],[94,86],[86,84],[78,80],[70,76],[62,72],[56,68],[50,70],[44,74],[38,78],[32,82],[26,86],[20,90],[14,94],[8,98],[4,100],[2,94],[4,86],[8,78],[10,70],[8,62],[6,54],[8,46],[10,38],[12,30],[12,20]]]
    }
];

const COLORS_WORD = ["Red", "Blue", "Green", "Yellow", "Purple", "Orange"];

const ShapeGuess = {
    canvas: null,
    ctx: null,
    ui: null,

    // Game state
    score: 0,
    lives: 3,
    streak: 0,
    bestStreak: 0,
    timerMax: 12000,
    timerRemaining: 12000,
    lastTimestamp: 0,
    animFrameId: null,
    paused: false,
    gameOver: false,
    answered: false,

    // Current round
    currentCountry: null,
    options: [],
    correctIndex: -1,
    feedbackText: "",
    feedbackColor: "",
    feedbackTimer: 0,

    // Used countries this session to reduce repeats
    usedIndices: [],

    // Button rects for click detection
    buttonRects: [],

    // Bound handlers
    _boundKeyDown: null,
    _boundClick: null,
    _boundTouch: null,

    init(canvas, ctx, ui) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ui = ui;
        this._boundKeyDown = this._onKeyDown.bind(this);
        this._boundClick = this._onClick.bind(this);
        this._boundTouch = this._onTouch.bind(this);
    },

    start() {
        this.score = 0;
        this.lives = 3;
        this.streak = 0;
        this.bestStreak = 0;
        this.paused = false;
        this.gameOver = false;
        this.answered = false;
        this.feedbackText = "";
        this.feedbackTimer = 0;
        this.usedIndices = [];
        this.ui.setScore(0);
        this.ui.hideGameOver();
        this.ui.hidePause();

        document.addEventListener("keydown", this._boundKeyDown);
        this.canvas.addEventListener("click", this._boundClick);
        this.canvas.addEventListener("touchstart", this._boundTouch, { passive: false });

        this._nextRound();
        this.lastTimestamp = performance.now();
        this._loop(this.lastTimestamp);
    },

    pause() {
        if (this.gameOver) return;
        this.paused = true;
        this.ui.showPause();
    },

    resume() {
        if (this.gameOver) return;
        this.paused = false;
        this.ui.hidePause();
        this.lastTimestamp = performance.now();
        this._loop(this.lastTimestamp);
    },

    reset() {
        this.destroy();
        this.start();
    },

    destroy() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        document.removeEventListener("keydown", this._boundKeyDown);
        this.canvas.removeEventListener("click", this._boundClick);
        this.canvas.removeEventListener("touchstart", this._boundTouch);
    },

    // --- Private methods ---

    _nextRound() {
        // Pick a country not recently used
        let available = [];
        for (let i = 0; i < COUNTRY_SHAPES.length; i++) {
            if (!this.usedIndices.includes(i)) available.push(i);
        }
        if (available.length < 4) {
            this.usedIndices = [];
            available = COUNTRY_SHAPES.map((_, i) => i);
        }

        // Pick correct answer
        const correctIdx = available[Math.floor(Math.random() * available.length)];
        this.usedIndices.push(correctIdx);
        this.currentCountry = COUNTRY_SHAPES[correctIdx];

        // Pick 3 wrong answers
        const wrongPool = [];
        for (let i = 0; i < COUNTRY_SHAPES.length; i++) {
            if (i !== correctIdx) wrongPool.push(i);
        }
        this._shuffle(wrongPool);
        const wrongIndices = wrongPool.slice(0, 3);

        // Build options
        this.options = [
            this.currentCountry.name,
            COUNTRY_SHAPES[wrongIndices[0]].name,
            COUNTRY_SHAPES[wrongIndices[1]].name,
            COUNTRY_SHAPES[wrongIndices[2]].name
        ];
        // Shuffle and track correct
        const order = [0, 1, 2, 3];
        this._shuffle(order);
        const shuffled = order.map(i => this.options[i]);
        this.correctIndex = shuffled.indexOf(this.currentCountry.name);
        this.options = shuffled;

        this.timerRemaining = this.timerMax;
        this.answered = false;
        this.feedbackText = "";
        this.feedbackTimer = 0;
    },

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    },

    _answer(index) {
        if (this.answered || this.paused || this.gameOver) return;
        this.answered = true;

        if (index === this.correctIndex) {
            this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
            // Score: 1 base + streak bonus
            const bonus = Math.min(this.streak - 1, 5);
            const points = 1 + bonus;
            this.score += points;
            this.ui.setScore(this.score);
            this.feedbackText = points > 1 ? `Correct! +${points} (${this.streak}x streak)` : "Correct! +1";
            this.feedbackColor = "#00e676";
        } else {
            this.streak = 0;
            this.lives--;
            this.feedbackText = `Wrong! It was ${this.currentCountry.name}`;
            this.feedbackColor = "#ff2d7b";
        }
        this.feedbackTimer = 1500;

        if (this.lives <= 0) {
            this._endGame();
        }
    },

    _timeout() {
        if (this.answered || this.paused || this.gameOver) return;
        this.answered = true;
        this.streak = 0;
        this.lives--;
        this.feedbackText = `Time's up! It was ${this.currentCountry.name}`;
        this.feedbackColor = "#ffd60a";
        this.feedbackTimer = 1500;

        if (this.lives <= 0) {
            this._endGame();
        }
    },

    _endGame() {
        this.gameOver = true;
        const best = this.ui.getHighScore();
        if (this.score > best) {
            this.ui.setHighScore(this.score);
        }
        // Delay showing game over to let feedback display
        setTimeout(() => {
            this.ui.showGameOver(this.score, Math.max(this.score, best));
        }, 1200);
    },

    _loop(timestamp) {
        if (this.gameOver && this.feedbackTimer <= 0) return;

        const dt = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        if (!this.paused) {
            this._update(dt);
            this._render();
        }

        this.animFrameId = requestAnimationFrame(this._loop.bind(this));
    },

    _update(dt) {
        // Update feedback timer
        if (this.feedbackTimer > 0) {
            this.feedbackTimer -= dt;
            if (this.feedbackTimer <= 0 && !this.gameOver) {
                this._nextRound();
            }
        }

        // Update round timer
        if (!this.answered && !this.gameOver) {
            this.timerRemaining -= dt;
            if (this.timerRemaining <= 0) {
                this.timerRemaining = 0;
                this._timeout();
            }
        }
    },

    _render() {
        const W = this.ui.canvasW;
        const H = this.ui.canvasH;
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(0, 0, W, H);

        // Timer bar at top
        const barH = 6;
        const barY = 10;
        const barW = W - 60;
        const barX = 30;
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(barX, barY, barW, barH);
        const pct = Math.max(0, this.timerRemaining / this.timerMax);
        let barColor = "#00d4ff";
        if (pct < 0.25) barColor = "#ff2d7b";
        else if (pct < 0.5) barColor = "#ffd60a";
        ctx.fillStyle = barColor;
        ctx.fillRect(barX, barY, barW * pct, barH);

        // Lives display
        ctx.fillStyle = "#e8e8f0";
        ctx.font = "bold 18px 'Outfit', sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        let livesStr = "";
        for (let i = 0; i < 3; i++) {
            livesStr += i < this.lives ? "♥ " : "♡ ";
        }
        ctx.fillText(livesStr, 30, 26);

        // Streak
        ctx.textAlign = "right";
        if (this.streak > 0) {
            ctx.fillStyle = "#ffd60a";
            ctx.fillText(`🔥 ${this.streak}`, W - 30, 26);
        }

        // Score
        ctx.textAlign = "center";
        ctx.fillStyle = "#8888a0";
        ctx.font = "16px 'JetBrains Mono', monospace";
        ctx.fillText(`Score: ${this.score}`, W / 2, 28);

        // Country shape area
        const shapeAreaX = (W - 280) / 2;
        const shapeAreaY = 50;
        const shapeAreaW = 280;
        const shapeAreaH = 240;

        // Subtle border around shape area
        ctx.strokeStyle = "rgba(0, 212, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.strokeRect(shapeAreaX - 10, shapeAreaY - 10, shapeAreaW + 20, shapeAreaH + 20);

        // Draw country shape
        if (this.currentCountry) {
            this._drawCountry(this.currentCountry, shapeAreaX, shapeAreaY, shapeAreaW, shapeAreaH);
        }

        // Answer buttons
        const btnW = 340;
        const btnH = 42;
        const btnX = (W - btnW) / 2;
        const btnStartY = 320;
        const btnGap = 8;
        this.buttonRects = [];

        for (let i = 0; i < 4; i++) {
            const by = btnStartY + i * (btnH + btnGap);
            this.buttonRects.push({ x: btnX, y: by, w: btnW, h: btnH });

            // Button background
            let bgColor = "#12121a";
            let borderColor = "rgba(255,255,255,0.08)";
            let textColor = "#e8e8f0";

            if (this.answered) {
                if (i === this.correctIndex) {
                    bgColor = "rgba(0, 230, 118, 0.2)";
                    borderColor = "#00e676";
                    textColor = "#00e676";
                } else if (this.feedbackColor === "#ff2d7b" || this.feedbackColor === "#ffd60a") {
                    // Dim wrong answers
                    textColor = "#555570";
                }
            }

            ctx.fillStyle = bgColor;
            this._roundRect(ctx, btnX, by, btnW, btnH, 10);
            ctx.fill();
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1.5;
            this._roundRect(ctx, btnX, by, btnW, btnH, 10);
            ctx.stroke();

            // Button text
            ctx.fillStyle = textColor;
            ctx.font = "bold 17px 'Outfit', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${i + 1}. ${this.options[i]}`, btnX + btnW / 2, by + btnH / 2);
        }

        // Feedback text
        if (this.feedbackText && this.feedbackTimer > 0) {
            const alpha = Math.min(1, this.feedbackTimer / 300);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.feedbackColor;
            ctx.font = "bold 22px 'Outfit', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.feedbackText, W / 2, H - 30);
            ctx.globalAlpha = 1;
        }

        // Controls hint
        ctx.fillStyle = "#555570";
        ctx.font = "13px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Keys 1-4 to answer · P to pause", W / 2, H - 8);
    },

    _drawCountry(country, areaX, areaY, areaW, areaH) {
        const ctx = this.ctx;
        const polys = country.polys;

        // Find bounding box across all polygons
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const poly of polys) {
            for (const [px, py] of poly) {
                if (px < minX) minX = px;
                if (py < minY) minY = py;
                if (px > maxX) maxX = px;
                if (py > maxY) maxY = py;
            }
        }

        const dataW = maxX - minX || 1;
        const dataH = maxY - minY || 1;
        const padding = 20;
        const scaleX = (areaW - padding * 2) / dataW;
        const scaleY = (areaH - padding * 2) / dataH;
        const scale = Math.min(scaleX, scaleY);
        const drawW = dataW * scale;
        const drawH = dataH * scale;
        const offsetX = areaX + (areaW - drawW) / 2;
        const offsetY = areaY + (areaH - drawH) / 2;

        // Glow effect
        ctx.shadowColor = "rgba(0, 212, 255, 0.4)";
        ctx.shadowBlur = 20;

        for (const poly of polys) {
            ctx.beginPath();
            for (let i = 0; i < poly.length; i++) {
                const x = offsetX + (poly[i][0] - minX) * scale;
                const y = offsetY + (poly[i][1] - minY) * scale;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();

            // Fill with gradient
            const grad = ctx.createLinearGradient(offsetX, offsetY, offsetX + drawW, offsetY + drawH);
            grad.addColorStop(0, "rgba(0, 212, 255, 0.85)");
            grad.addColorStop(1, "rgba(0, 180, 220, 0.65)");
            ctx.fillStyle = grad;
            ctx.fill();

            // Outline
            ctx.strokeStyle = "rgba(0, 212, 255, 0.9)";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
    },

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    _getButtonAtPos(x, y) {
        for (let i = 0; i < this.buttonRects.length; i++) {
            const r = this.buttonRects[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                return i;
            }
        }
        return -1;
    },

    _onKeyDown(e) {
        if (e.key === "p" || e.key === "P") {
            e.preventDefault();
            if (this.paused) this.resume();
            else this.pause();
            return;
        }
        if (e.key >= "1" && e.key <= "4") {
            e.preventDefault();
            this._answer(parseInt(e.key) - 1);
        }
    },

    _onClick(e) {
        if (this.paused || this.gameOver) return;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const idx = this._getButtonAtPos(x, y);
        if (idx >= 0) this._answer(idx);
    },

    _onTouch(e) {
        e.preventDefault();
        if (this.paused || this.gameOver) return;
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.ui.canvasW / rect.width;
        const scaleY = this.ui.canvasH / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        const idx = this._getButtonAtPos(x, y);
        if (idx >= 0) this._answer(idx);
    }
};

export default ShapeGuess;
