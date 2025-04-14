layerConfig = [{
    "id": "wind",
    "name": "风",
    "gradient": "wind",
    "legend": {
        "colors": ["rgb(98,113,184)", "rgb(61,110,163)", "rgb(74,148,170)", "rgb(74,146,148)", "rgb(77,142,124)", "rgb(76,164,76)", "rgb(103,164,54)", "rgb(162,135,64)", "rgb(162,109,92)", "rgb(141,63,92)", "rgb(151,75,145)", "rgb(95,100,160)", "rgb(91,136,161)", "rgb(91,136,161)"],
        "units": ["kt", "bft", "m/s", "mph", "km/h"],
        "lines": [[0, 0, 0, 0, 0, 0], [3, 5, 2, 3, 6, 10], [5, 10, 3, 5, 10, 20], [10, 20, 5, 10, 20, 35], [15, 30, 7, 15, 35, 55], [20, 40, 8, 20, 45, 70], [30, 60, 11, 30, 70, 100]]
    },
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/wind-{level}.jpg",
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "gust",
    "name": "阵风",
    "gradient": "wind",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/gust-{level}.jpg",
    "legend": {
        "colors": ["rgb(98,113,184)", "rgb(61,110,163)", "rgb(74,148,170)", "rgb(74,146,148)", "rgb(77,142,124)", "rgb(76,164,76)", "rgb(103,164,54)", "rgb(162,135,64)", "rgb(162,109,92)", "rgb(141,63,92)", "rgb(151,75,145)", "rgb(95,100,160)", "rgb(91,136,161)", "rgb(91,136,161)"],
        "units": ["kt", "bft", "m/s", "mph", "km/h"],
        "lines": [[0, 0, 0, 0, 0, 0], [3, 5, 2, 3, 6, 10], [5, 10, 3, 5, 10, 20], [10, 20, 5, 10, 20, 35], [15, 30, 7, 15, 35, 55], [20, 40, 8, 20, 45, 70], [30, 60, 11, 30, 70, 100]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "gustAccu",
    "name": "最大阵风风力",
    "gradient": "wind",
    "isAccumulations": true,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{acTime}/wm_grid_257/{z}/{x}/{y}/gust-surface.jpg?acc=maxip",
    "legend": {
        "colors": ["rgb(98,113,184)", "rgb(61,110,163)", "rgb(74,148,170)", "rgb(74,146,148)", "rgb(77,142,124)", "rgb(76,164,76)", "rgb(103,164,54)", "rgb(162,135,64)", "rgb(162,109,92)", "rgb(141,63,92)", "rgb(151,75,145)", "rgb(95,100,160)", "rgb(91,136,161)", "rgb(91,136,161)"],
        "units": ["kt", "bft", "m/s", "mph", "km/h"],
        "lines": [[0, 0, 0, 0, 0, 0], [3, 5, 2, 3, 6, 10], [5, 10, 3, 5, 10, 20], [10, 20, 5, 10, 20, 35], [15, 30, 7, 15, 35, 55], [20, 40, 8, 20, 45, 70], [30, 60, 11, 30, 70, 100]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "rain",
    "name": "雨、雷暴",
    "gradient": "rain",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/rainlogptype2-{level}.png",
    "legend": {
        "colors": ["rgb(59,124,162)", "rgb(59,126,162)", "rgb(59,128,162)", "rgb(58,133,162)", "rgb(58,137,162)", "rgb(58,153,162)", "rgb(50,166,111)", "rgb(74,164,57)", "rgb(129,162,59)", "rgb(162,162,59)", "rgb(162,60,59)", "rgb(171,54,107)", "rgb(164,58,154)", "rgb(164,58,154)"],
        "units": ["mm", "in"],
        "lines": [[1.5, 1.5, ".06"], [2, 2, ".08"], [3, 3, ".11"], [7, 7, ".24"], [10, 10, ".39"], [20, 20, ".78"], [30, 30, 1.2]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "rainAccu",
    "name": "降雨量",
    "gradient": "rain_accu",
    "isAccumulations": true,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{acTime}/wm_grid_257/{z}/{x}/{y}/rainaccumulationlog-surface.jpg",
    "legend": {
        "colors": ["rgb(97,88,130)", "rgb(73,102,142)", "rgb(52,117,143)", "rgb(42,123,140)", "rgb(31,129,137)", "rgb(11,141,130)", "rgb(92,154,100)", "rgb(251,158,191)", "rgb(249,162,193)", "rgb(249,162,193)"],
        "units": ["mm", "in"],
        "lines": [[5, 5, ".2"], [10, 10, ".4"], [20, 20, ".8"], [40, 40, 1.5], [1000, "1m", "3ft"]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "snowAccu",
    "name": "新雪",
    "gradient": "snow",
    "isAccumulations": true,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{acTime}/wm_grid_257/{z}/{x}/{y}/snowaccumulationlog-surface.jpg",
    "legend": {
        "colors": ["rgb(70,83,151)", "rgb(67,97,160)", "rgb(64,113,164)", "rgb(62,139,166)", "rgb(65,163,167)", "rgb(95,154,56)", "rgb(168,169,65)", "rgb(171,134,62)", "rgb(172,95,62)", "rgb(174,62,86)", "rgb(177,60,116)", "rgb(177,60,116)"],
        "units": ["cm", "in"],
        "lines": [[2, 2, ".8"], [5, 5, 2], [10, 10, 4], [50, 50, 20], [100, "1m", "3ft"], [300, "3m", "9ft"]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "snowcover",
    "name": "积雪深度",
    "gradient": "snow",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/snowcoverlog-{level}.jpg",
    // "templateUrl": "https://ims.windy.com/im/v3.0/forecast/ecmwf-hres/2023112712/2023112806/wm_grid_257/{z}/{x}/{y}/snowcoverlog-surface.jpg",
    "legend": {
        "colors": ["rgb(70,83,151)", "rgb(67,97,160)", "rgb(64,113,164)", "rgb(62,139,166)", "rgb(65,163,167)", "rgb(95,154,56)", "rgb(168,169,65)", "rgb(171,134,62)", "rgb(172,95,62)", "rgb(174,62,86)", "rgb(177,60,116)", "rgb(177,60,116)"],
        "units": ["cm", "in"],
        "lines": [[2, 2, ".8"], [5, 5, 2], [10, 10, 4], [50, 50, 20], [100, "1m", "3ft"], [300, "3m", "9ft"]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "ptype",
    "name": "降水类型",
    "gradient": "just_gray",
    "render": 'ptype',
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/rainlogptype-{level}.png",
    "legend": {
        "discrete": true,
        "colors": ["rgb(0,153,182)", "rgb(144,0,150)", "rgb(81,12,15)", "rgb(178,178,178)", "rgb(86,148,86)", "rgb(149,161,9)"],
        "labels": ["雨", "冻雨", "混合冰", "雪", "湿雪", "雨夹雪"]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "thunder",
    "name": "雷暴",
    "gradient": "light_density",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/lightdens-{level}.jpg",
    "legend": {
        "colors": ["rgb(137,137,137)", "rgb(137,137,137)", "rgb(137,181,41)", "rgb(173,209,0)", "rgb(214,218,0)", "rgb(235,157,0)", "rgb(242,96,0)", "rgb(155,10,33)", "rgb(199,45,147)", "rgb(222,101,255)", "rgb(222,101,255)", "rgb(222,101,255)"],
        "units": ["l/km²"],
        "lines": [[0, 0], [0.025, ".025"], [0.1, ".1"], [1, 1], [10, 10], [20, 20]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }],
    "levels": ["surface", "100m", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "temp",
    "name": "温度",
    "gradient": "temp",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/temp-{level}.jpg",
    "legend": {
        "colors": ["rgb(149,137,211)", "rgb(150,209,216)", "rgb(129,204,197)", "rgb(103,180,186)", "rgb(95,143,197)", "rgb(80,140,62)", "rgb(121,146,28)", "rgb(171,161,14)", "rgb(223,177,6)", "rgb(243,150,6)", "rgb(236,95,21)", "rgb(190,65,18)", "rgb(138,43,10)", "rgb(138,43,10)"],
        "units": ["°C", "°F"],
        "lines": [[252, -20, -5], [262, -10, 15], [272, 0, 30], [282, 10, 50], [292, 20, 70], [302, 30, 85], [313, 40, 100]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "dewpoint",
    "name": "露点",
    "gradient": "temp",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/dewpoint-{level}.jpg",
    "legend": {
        "colors": ["rgb(149,137,211)", "rgb(150,209,216)", "rgb(129,204,197)", "rgb(103,180,186)", "rgb(95,143,197)", "rgb(80,140,62)", "rgb(121,146,28)", "rgb(171,161,14)", "rgb(223,177,6)", "rgb(243,150,6)", "rgb(236,95,21)", "rgb(190,65,18)", "rgb(138,43,10)", "rgb(138,43,10)"],
        "units": ["°C", "°F"],
        "lines": [[252, -20, -5], [262, -10, 15], [272, 0, 30], [282, 10, 50], [292, 20, 70], [302, 30, 85], [313, 40, 100]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "rh",
    "name": "湿度",
    "gradient": "rh",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/rh-{level}.jpg",
    "legend": {
        "colors": ["rgb(174,110,56)", "rgb(174,146,56)", "rgb(105,174,56)", "rgb(54,175,148)", "rgb(56,158,174)", "rgb(56,142,174)", "rgb(56,133,174)", "rgb(56,111,166)", "rgb(56,71,116)", "rgb(56,71,116)"],
        "units": ["%"],
        "lines": [[30, 30], [50, 50], [80, 80], [90, 90], [100, 100]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "deg0",
    "name": "冰冻高度",
    "gradient": "deg0",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/deg0-{level}.jpg",
    "legend": {
        "colors": ["rgb(189,198,196)", "rgb(156,196,190)", "rgb(81,142,130)", "rgb(68,132,120)", "rgb(55,123,110)", "rgb(33,67,73)", "rgb(32,55,71)", "rgb(30,47,69)", "rgb(29,38,66)", "rgb(29,38,66)"],
        "units": ["m", "ft"],
        "lines": [[0, 0, 0], [1000, 1000, 3000], [1500, 1500, 5000], [5000, "5k", "FL150"], [9000, "9k", "FL300"]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "wetbulbtemp",
    "name": "湿球温度",
    "gradient": "wetbulbtemp",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/wbt-{level}.jpg",
    "legend": {
        "colors": ["rgb(255,255,255)", "rgb(244,239,205)", "rgb(231,218,74)", "rgb(238,197,15)", "rgb(238,153,0)", "rgb(224,107,0)", "rgb(203,45,43)", "rgb(148,12,12)", "rgb(6,0,0)", "rgb(6,0,0)"],
        "units": ["°C", "°F"],
        "lines": [[273, 0, 32], [291, 18, 64], [298, 25, 77], [302, 29, 84], [305, 32, 90]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "solarpower",
    "name": "太阳辐射",
    "gradient": "solarpower",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/solarpower-{level}.jpg",
    "legend": {
        "colors": ["rgb(110,110,110)", "rgb(202,72,81)", "rgb(214,100,83)", "rgb(225,126,89)", "rgb(235,151,100)", "rgb(245,175,114)", "rgb(253,199,134)", "rgb(255,223,155)", "rgb(255,246,181)", "rgb(255,246,181)"],
        "units": ["W/m²"],
        "lines": [[0, 0], [250, 250], [500, 500], [750, 750], [1000, 1000]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "uvindex",
    "name": "紫外线指数",
    "gradient": "uvindex",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/uvindex-{level}.png",
    "legend": {
        "discrete": true,
        "colors": ["rgb(41,148,26)", "rgb(235,224,0)", "rgb(222,120,0)", "rgb(210,30,0)", "rgb(162,83,144)"],
        "labels": ["低", "中", "高", "很高", "极端"]
    },
    "models": [{
        "name": "CAMS", "directory": "forecast/cams-global", "url": "/metadata/v1.0/forecast/cams-global/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "clouds",
    "name": "云",
    "gradient": "clouds",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/cloudsrain-{level}.jpg",
    "legend": {
        "colors": ["rgb(65,125,170)", "rgb(62,148,171)", "rgb(62,169,172)", "rgb(62,172,172)", "rgb(62,172,172)", "rgb(62,172,172)", "rgb(55,166,137)", "rgb(68,145,61)", "rgb(121,156,60)", "rgb(170,171,62)", "rgb(170,64,62)", "rgb(180,57,114)", "rgb(175,60,161)", "rgb(175,60,161)"],
        "units": ["mm", "in"],
        "lines": [[1.5, 1.5, ".06"], [2, 2, ".08"], [3, 3, ".11"], [7, 7, ".24"], [10, 10, ".39"], [20, 20, ".78"], [30, 30, 1.2]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "hclouds",
    "name": "高云",
    "gradient": "hclouds",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/hclouds-{level}.jpg",
    "legend": {
        "colors": ["rgb(117,158,137)", "rgb(127,159,159)", "rgb(131,162,162)", "rgb(134,164,164)", "rgb(136,166,166)", "rgb(140,169,169)", "rgb(187,188,188)", "rgb(187,188,188)"],
        "units": ["rules", "%"],
        "lines": [[25, "FEW", 25], [50, "SCT", 50], [70, "BKN", 70], [100, "OVC", 100]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "mclouds",
    "name": "中云",
    "gradient": "mclouds",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/mclouds-{level}.jpg",
    "legend": {
        "colors": ["rgb(152,180,135)", "rgb(156,190,156)", "rgb(154,186,154)", "rgb(152,182,152)", "rgb(150,179,150)", "rgb(147,173,147)", "rgb(187,188,187)", "rgb(187,188,187)"],
        "units": ["rules", "%"],
        "lines": [[25, "FEW", 25], [50, "SCT", 50], [70, "BKN", 70], [100, "OVC", 100]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "lclouds",
    "name": "低云",
    "gradient": "lclouds",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/lclouds-{level}.jpg",
    "legend": {
        "colors": ["rgb(133,130,119)", "rgb(131,133,136)", "rgb(132,140,147)", "rgb(134,145,156)", "rgb(135,150,165)", "rgb(137,157,178)", "rgb(187,187,188)", "rgb(187,187,188)"],
        "units": ["rules", "%"],
        "lines": [[25, "FEW", 25], [50, "SCT", 50], [70, "BKN", 70], [100, "OVC", 100]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "fog",
    "name": "雾",
    "gradient": "fog",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/fogtype-{level}.png",
    "legend": {
        "discrete": true, "colors": ["#c6c6c6", "#c9c9ff"], "labels": ["雾", "雾和雾凇"]
    },
    "models": [{
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "cloudtop",
    "name": "云顶",
    "gradient": "levels",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/cloudtop-{level}.jpg",
    "legend": {
        "colors": ["rgb(111,111,111)", "rgb(96,116,133)", "rgb(72,139,146)", "rgb(72,169,113)", "rgb(128,191,68)", "rgb(190,163,62)", "rgb(178,81,80)", "rgb(187,76,131)", "rgb(179,80,179)", "rgb(179,80,179)"],
        "units": ["m", "ft"],
        "lines": [[0, 0, 0], [5000, "5k", "FL150"], [9000, "9k", "FL300"], [12000, "12k", "FL400"], [15000, "15k", "FL500"]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }],
    "levels": ["surface", "100m", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "cbase",
    "name": "云底",
    "gradient": "cbase",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/cbase-{level}.png",
    "legend": {
        "colors": ["rgb(167,93,166)", "rgb(164,96,162)", "rgb(168,91,91)", "rgb(98,122,161)", "rgb(98,122,161)", "rgb(90,169,92)", "rgb(91,168,99)", "rgb(91,168,99)"],
        "units": ["m", "ft"],
        "lines": [[0, 0, 0], [200, 300, 1000], [500, 500, 1500], [1500, "1.5k", 5000]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }],
    "levels": ["surface", "100m", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "visibility",
    "name": "能见度",
    "gradient": "visibility",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/visibility-{level}.jpg",
    "legend": {
        "colors": ["rgb(164,89,164)", "rgb(162,89,164)", "rgb(168,86,86)", "rgb(168,86,86)", "rgb(89,99,164)", "rgb(70,180,74)", "rgb(91,158,85)", "rgb(91,158,85)"],
        "units": ["rules", "km", "sm"],
        "lines": [[0, "LIFR", ".8", ".5"], [3000, "IFR", 2.7, 1.5], [7000, "MVFR", 6, 4], [16000, "VFR", 16, 10]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }],
    "levels": ["surface", "100m", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "cape",
    "name": "对流有效位能指数",
    "gradient": "cape",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/cape-{level}.jpg",
    "legend": {
        "colors": ["rgb(110,110,110)", "rgb(110,110,110)", "rgb(38,98,145)", "rgb(67,169,33)", "rgb(164,162,55)", "rgb(156,113,63)", "rgb(163,56,55)", "rgb(166,57,104)", "rgb(152,68,151)", "rgb(152,68,151)"],
        "units": ["J/kg"],
        "lines": [[0, 0], [500, 500], [1500, 1500], [2500, 2500], [5000, 5000]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "ccl",
    "name": "热气流",
    "gradient": "cclAltitude",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/ccl-{level}.png",
    "legend": {
        "colors": ["rgb(129,129,129)", "rgb(129,129,129)", "rgb(214,212,174)", "rgb(207,178,102)", "rgb(200,144,32)", "rgb(202,109,12)", "rgb(194,72,16)", "rgb(184,57,24)", "rgb(173,43,33)", "rgb(134,12,12)", "rgb(118,9,20)", "rgb(101,7,28)", "rgb(83,5,36)", "rgb(83,5,36)"],
        "units": ["m", "ft"],
        "lines": [[0, 0, 0], [1000, "1k", "3.3k"], [2000, "2k", "6.6k"], [3000, "3k", "10k"], [4000, "4k", "13k"], [6000, "6k", "20k"], [8000, "8k", "26k"]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "waves",
    "name": "海浪",
    "gradient": "waves",
    'sea': true,
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/waves-{level}.png",
    "legend": {
        "colors": ["rgb(50,158,186)", "rgb(48,128,164)", "rgb(48,99,142)", "rgb(52,101,166)", "rgb(56,104,192)", "rgb(56,83,169)", "rgb(57,61,143)", "rgb(134,48,49)", "rgb(194,76,91)", "rgb(192,118,105)", "rgb(192,162,157)", "rgb(192,162,157)"],
        "units": ["m", "ft"],
        "lines": [[0.5, 0.5, 1.6], [1, 1, 3.3], [1.5, 1.5, 5], [2, 2, 6.6], [6, 6, 20], [9, 9, 30]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-wam", "url": "/metadata/v1.0/forecast/ecmwf-wam/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs-wave", "url": "/metadata/v1.0/forecast/gfs-wave/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-gwam", "url": "/metadata/v1.0/forecast/icon-gwam/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "swell1",
    "name": "涌浪",
    "gradient": "waves",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/swell1-{level}.png",
    "legend": {
        "colors": ["rgb(50,158,186)", "rgb(48,128,164)", "rgb(48,99,142)", "rgb(52,101,166)", "rgb(56,104,192)", "rgb(56,83,169)", "rgb(57,61,143)", "rgb(134,48,49)", "rgb(194,76,91)", "rgb(192,118,105)", "rgb(192,162,157)", "rgb(192,162,157)"],
        "units": ["m", "ft"],
        "lines": [[0.5, 0.5, 1.6], [1, 1, 3.3], [1.5, 1.5, 5], [2, 2, 6.6], [6, 6, 20], [9, 9, 30]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-wam", "url": "/metadata/v1.0/forecast/ecmwf-wam/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs-wave", "url": "/metadata/v1.0/forecast/gfs-wave/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-gwam", "url": "/metadata/v1.0/forecast/icon-gwam/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "swell2",
    "name": "二级涌浪",
    "gradient": "waves",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/swell2-{level}.png",
    "legend": {
        "colors": ["rgb(50,158,186)", "rgb(48,128,164)", "rgb(48,99,142)", "rgb(52,101,166)", "rgb(56,104,192)", "rgb(56,83,169)", "rgb(57,61,143)", "rgb(134,48,49)", "rgb(194,76,91)", "rgb(192,118,105)", "rgb(192,162,157)", "rgb(192,162,157)"],
        "units": ["m", "ft"],
        "lines": [[0.5, 0.5, 1.6], [1, 1, 3.3], [1.5, 1.5, 5], [2, 2, 6.6], [6, 6, 20], [9, 9, 30]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-wam", "url": "/metadata/v1.0/forecast/ecmwf-wam/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs-wave", "url": "/metadata/v1.0/forecast/gfs-wave/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "swell3",
    "name": "三级涌浪",
    "gradient": "waves",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/swell3-{level}.png",
    "legend": {
        "colors": ["rgb(50,158,186)", "rgb(48,128,164)", "rgb(48,99,142)", "rgb(52,101,166)", "rgb(56,104,192)", "rgb(56,83,169)", "rgb(57,61,143)", "rgb(134,48,49)", "rgb(194,76,91)", "rgb(192,118,105)", "rgb(192,162,157)", "rgb(192,162,157)"],
        "units": ["m", "ft"],
        "lines": [[0.5, 0.5, 1.6], [1, 1, 3.3], [1.5, 1.5, 5], [2, 2, 6.6], [6, 6, 20], [9, 9, 30]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-wam", "url": "/metadata/v1.0/forecast/ecmwf-wam/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs-wave", "url": "/metadata/v1.0/forecast/gfs-wave/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "wwaves",
    "name": "风浪",
    "gradient": "waves",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/wwaves-{level}.png",
    "legend": {
        "colors": ["rgb(50,158,186)", "rgb(48,128,164)", "rgb(48,99,142)", "rgb(52,101,166)", "rgb(56,104,192)", "rgb(56,83,169)", "rgb(57,61,143)", "rgb(134,48,49)", "rgb(194,76,91)", "rgb(192,118,105)", "rgb(192,162,157)", "rgb(192,162,157)"],
        "units": ["m", "ft"],
        "lines": [[0.5, 0.5, 1.6], [1, 1, 3.3], [1.5, 1.5, 5], [2, 2, 6.6], [6, 6, 20], [9, 9, 30]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-wam", "url": "/metadata/v1.0/forecast/ecmwf-wam/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs-wave", "url": "/metadata/v1.0/forecast/gfs-wave/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-gwam", "url": "/metadata/v1.0/forecast/icon-gwam/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "sst",
    "name": "海水温度",
    "gradient": "temp",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/sst-{level}.jpg",
    "legend": {
        "colors": ["rgb(95,143,197)", "rgb(80,140,62)", "rgb(121,146,28)", "rgb(171,161,14)", "rgb(223,177,6)", "rgb(243,150,6)", "rgb(236,95,21)", "rgb(190,65,18)", "rgb(138,43,10)", "rgb(138,43,10)"],
        "units": ["°C", "°F"],
        "lines": [[272, 0, 30], [282, 10, 50], [292, 20, 70], [302, 30, 85], [313, 40, 100]]
    },
    "models": [{
        "name": "ECMWF", "directory": "analysis/ecmwf-hres", "url": "/metadata/v1.0/analysis/ecmwf-hres/minifest.json"
    }]
}, {
    "id": "currents",
    "name": "洋流",
    "gradient": "currents",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/seacurrents-{level}.jpg",
    "legend": {
        "colors": ["rgb(64,77,144)", "rgb(61,121,110)", "rgb(50,140,50)", "rgb(140,133,49)", "rgb(143,115,50)", "rgb(117,52,68)", "rgb(107,67,131)", "rgb(67,93,133)", "rgb(73,122,132)", "rgb(115,135,139)", "rgb(144,144,144)", "rgb(144,144,144)"],
        "units": ["kt", "m/s", "mph", "km/h"],
        "lines": [[0, 0, 0, 0, 0], [0.2, 0.4, 0.2, 0.4, 0.7], [0.4, 0.8, 0.4, 0.9, 1.4], [0.8, 1.6, 0.8, 1.8, 2.9], [1, 2, 1, 2.2, 3.6], [1.6, 3.2, 1.6, 3.6, 5.8]]
    },
    "models": [{
        "name": "CMEMS", "directory": "forecast/cmems", "url": "/metadata/v1.0/forecast/cmems/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "currentsTide",
    "name": "潮流",
    "gradient": "currentsTide",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/seacurrents_tide-{level}.jpg",
    "legend": {
        "colors": ["rgb(64,77,144)", "rgb(61,121,110)", "rgb(50,140,50)", "rgb(140,133,49)", "rgb(143,115,50)", "rgb(117,52,68)", "rgb(107,67,131)", "rgb(67,93,133)", "rgb(73,122,132)", "rgb(115,135,139)", "rgb(144,144,144)", "rgb(144,144,144)"],
        "units": ["kt", "m/s", "mph", "km/h"],
        "lines": [[0, 0, 0, 0, 0], [0.2, 0.4, 0.2, 0.4, 0.7], [0.4, 0.8, 0.4, 0.9, 1.4], [0.8, 1.6, 0.8, 1.8, 2.9], [1, 2, 1, 2.2, 3.6], [1.6, 3.2, 1.6, 3.6, 5.8]]
    },
    "models": [{
        "name": "CMEMS", "directory": "forecast/cmems", "url": "/metadata/v1.0/forecast/cmems/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "no2",
    "name": "二氧化氮",
    "gradient": "no2",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/no2-{level}.png",
    "legend": {
        "colors": ["rgb(0,102,152)", "rgb(42,129,171)", "rgb(84,156,190)", "rgb(195,196,125)", "rgb(198,188,115)", "rgb(216,145,75)", "rgb(228,103,42)", "rgb(147,37,12)", "rgb(75,12,0)", "rgb(75,12,0)"],
        "units": ["µg/m³"],
        "lines": [[0, 0], [1, 1], [5, 5], [25, 25], [100, 100]]
    },
    "models": [{
        "name": "CAMS", "directory": "forecast/cams-global", "url": "/metadata/v1.0/forecast/cams-global/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "pm2p5",
    "name": "PM2.5",
    "gradient": "pm2p5",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/pm2p5-{level}.png",
    "legend": {
        "colors": ["rgb(0,102,152)", "rgb(62,142,180)", "rgb(125,182,210)", "rgb(171,184,190)", "rgb(183,190,158)", "rgb(209,164,91)", "rgb(221,127,61)", "rgb(75,12,0)", "rgb(75,12,0)", "rgb(75,12,0)"],
        "units": ["µg/m³"],
        "lines": [[0, 0], [10, 10], [20, 20], [100, 100], [1000, 1000]]
    },
    "models": [{
        "name": "CAMS", "directory": "forecast/cams-global", "url": "/metadata/v1.0/forecast/cams-global/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "aod550",
    "name": "气溶胶",
    "gradient": "aod550",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/aod550-{level}.png",
    "legend": {
        "colors": ["rgb(0,102,152)", "rgb(63,143,181)", "rgb(125,183,210)", "rgb(148,183,200)", "rgb(171,184,190)", "rgb(183,190,158)", "rgb(195,196,125)", "rgb(218,139,70)", "rgb(233,83,25)", "rgb(190,52,19)", "rgb(75,12,0)", "rgb(75,12,0)"],
        "units": ["AOD"],
        "lines": [[0, 0], [0.25, 0.25], [0.5, 0.5], [1, 1], [2, 2], [4, 4]]
    },
    "models": [{
        "name": "CAMS", "directory": "forecast/cams-global", "url": "/metadata/v1.0/forecast/cams-global/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "gtco3",
    "name": "臭氧层",
    "gradient": "gtco3",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/gtco3-{level}.png",
    "legend": {
        "colors": ["rgb(53,25,47)", "rgb(68,31,60)", "rgb(147,70,184)", "rgb(84,133,207)", "rgb(77,170,187)", "rgb(79,192,175)", "rgb(73,204,142)", "rgb(67,201,54)", "rgb(177,186,0)", "rgb(177,186,0)"],
        "units": ["DU"],
        "lines": [[150, 150], [220, 220], [280, 280], [330, 330], [400, 400]]
    },
    "models": [{
        "name": "CAMS", "directory": "forecast/cams-global", "url": "/metadata/v1.0/forecast/cams-global/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "tcso2",
    "name": "SO₂",
    "gradient": "tcso2",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/tcso2-{level}.png",
    "legend": {
        "colors": ["rgb(0,102,152)", "rgb(41,129,171)", "rgb(82,155,190)", "rgb(194,196,127)", "rgb(198,188,115)", "rgb(216,145,75)", "rgb(228,103,42)", "rgb(147,37,12)", "rgb(75,12,0)", "rgb(75,12,0)"],
        "units": ["mg/m²"],
        "lines": [[0, 0], [1, 1], [5, 5], [25, 25], [100, 100]]
    },
    "models": [{
        "name": "CAMS", "directory": "forecast/cams-global", "url": "/metadata/v1.0/forecast/cams-global/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "go3",
    "name": "地表臭氧",
    "gradient": "go3",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/go3-{level}.png",
    "legend": {
        "colors": ["rgb(0,102,152)", "rgb(0,102,152)", "rgb(0,102,152)", "rgb(0,102,152)", "rgb(0,102,152)", "rgb(88,159,192)", "rgb(189,193,142)", "rgb(75,12,0)", "rgb(75,12,0)", "rgb(75,12,0)"],
        "units": ["µg/m³"],
        "lines": [[0, 0], [10, 10], [20, 20], [100, 100], [1000, 1000]]
    },
    "models": [{
        "name": "CAMS", "directory": "forecast/cams-global", "url": "/metadata/v1.0/forecast/cams-global/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "cosc",
    "name": "CO 浓度",
    "gradient": "cosc",
    "isAccumulations": false,
    // https://ims.windy.com/im/v3.0/forecast/nasa-chem/2023120412/2023120503/wm_grid_257/3/6/3/chem_cosc-surface.jpg
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/2023120503/wm_grid_257/{z}/{x}/{y}/chem_cosc-{level}.jpg",
    "legend": {
        "colors": ["rgb(124,124,124)", "rgb(124,124,119)", "rgb(124,124,113)", "rgb(129,128,104)", "rgb(154,149,82)", "rgb(98,81,41)", "rgb(45,31,31)", "rgb(89,29,29)", "rgb(132,27,27)", "rgb(132,27,27)"],
        "units": ["ppbv"],
        "lines": [[0, 0], [50, 50], [100, 100], [500, 500], [1200, 1200]]
    },
    "models": [{
        "name": "GEOS-5", "directory": "forecast/nasa-chem", "url": "/metadata/v1.0/forecast/nasa-chem/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "dustsm",
    "name": "粉尘浓度",
    "gradient": "dust",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/chem_dustsm-{level}.jpg",
    "legend": {
        "colors": ["rgb(173,173,173)", "rgb(143,130,106)", "rgb(135,119,85)", "rgb(126,107,63)", "rgb(124,104,58)", "rgb(117,95,41)", "rgb(110,86,25)", "rgb(105,80,12)", "rgb(100,73,0)", "rgb(100,73,0)"],
        "units": ["µg/m³"],
        "lines": [[0, 0], [50, 50], [100, 100], [500, 500], [800, 800]]
    },
    "models": [{
        "name": "GEOS-5", "directory": "forecast/nasa-chem", "url": "/metadata/v1.0/forecast/nasa-chem/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "pressure",
    "name": "气压",
    "gradient": "pressure",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/{path}/wm_grid_257/{z}/{x}/{y}/pressure-{level}.png",
    "legend": {
        "colors": ["rgb(0,103,148)", "rgb(0,117,147)", "rgb(18,134,147)", "rgb(72,154,152)", "rgb(140,178,168)", "rgb(178,176,157)", "rgb(167,142,99)", "rgb(163,111,63)", "rgb(160,82,44)", "rgb(160,82,44)"],
        "units": ["hPa", "inHg", "mmHg"],
        "lines": [[99000, 990, 29.2, 742], [100000, 1000, 29.6, 750], [101000, 1010, 29.8, 757], [102000, 1020, 30.1, 765], [103000, 1030, 30.4, 772]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-hres", "url": "/metadata/v1.0/forecast/ecmwf-hres/minifest.json"
    }, {
        "name": "GFS", "directory": "forecast/gfs", "url": "/metadata/v1.0/forecast/gfs/minifest.json"
    }, {
        "name": "ICON", "directory": "forecast/icon-global", "url": "/metadata/v1.0/forecast/icon-global/minifest.json"
    }],
    "levels": ["surface", "950h", "925h", "900h", "850h", "800h", "700h", "600h", "500h", "400h", "300h", "250h", "200h", "150h"]
}, {
    "id": "efiTemp",
    "name": "极端天气预报",
    "gradient": "efiTemp",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/{directory}/{refTime}/2023112800/wm_grid_257/{z}/{x}/{y}/ti-{level}.jpg",
    "legend": {
        "colors": ["rgb(43,54,210)", "rgb(48,125,200)", "rgb(67,158,171)", "rgb(99,125,129)", "rgb(111,111,111)", "rgb(111,111,111)", "rgb(111,111,111)", "rgb(116,120,90)", "rgb(126,143,35)", "rgb(190,83,27)", "rgb(214,4,108)", "rgb(214,4,108)"],
        "units": ["%"],
        "lines": [[-1, "extreme"], [-0.75, "cold"], [-0.25, ""], [0.25, ""], [0.75, "extreme"], [1, "warm"]]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-efi", "url": "/metadata/v1.0/forecast/ecmwf-efi/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "tempAlerts",
    "name": "气象预警-温度",
    gradient: 'efiTemp',
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/forecast/ecmwf-efi/2023112800/2023112800/wm_grid_257/{z}/{x}/{y}/ti-surface.jpg",
    "legend": {
        "discrete": true, "colors": ["#b3b300", "#c17d00", "#a50000"], "labels": ["中", "严重", "极端"]
    },
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-efi", "url": "/metadata/v1.0/forecast/ecmwf-efi/minifest.json"
    }],
}, {
    id: 'windAlerts',
    name: '气象预警-风',
    gradient: 'efiWind',
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/forecast/ecmwf-efi/2023112800/2023112800/wm_grid_257/{z}/{x}/{y}/wsi-surface.jpg",
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-efi", "url": "/metadata/v1.0/forecast/ecmwf-efi/minifest.json"
    }],
}, {
    id: 'rainAlerts',
    name: '气象预警-雨',
    gradient: 'efiRain',
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/forecast/ecmwf-efi/2023112800/2023112800/wm_grid_257/{z}/{x}/{y}/tpi-surface.jpg",
    "models": [{
        "name": "ECMWF", "directory": "forecast/ecmwf-efi", "url": "/metadata/v1.0/forecast/ecmwf-efi/minifest.json"
    }],
}, {
    "id": "drought40",
    "name": "干旱监测-40cm干旱强度",
    "gradient": "drought",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/forecast/intersucho/2023112700/2023112800/wm_grid_257/{z}/{x}/{y}/awp_0_40-surface.png",
    "legend": {
        "discrete": true,
        "colors": ["rgb(241,223,120)", "rgb(236,184,50)", "rgb(221,144,13)", "rgb(194,95,0)", "rgb(158,34,12)", "rgb(120,0,19)"],
        "labels": ["轻度", "中度", "中", "严重", "特大", "极端"]
    },
    "models": [{
        "name": "InterSucho",
        "directory": "forecast/intersucho",
        "url": "metadata/v1.0/forecast/intersucho/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "drought100",
    "name": "干旱监测-100cm干旱强度",
    "gradient": "drought",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/forecast/intersucho/2023112700/2023112800/wm_grid_257/{z}/{x}/{y}/awp_0_100-surface.png",
    "models": [{
        "name": "InterSucho",
        "directory": "forecast/intersucho",
        "url": "metadata/v1.0/forecast/intersucho/minifest.json"
    }],
    "levels": ["surface"]
}, {
    'id': 'moistureAnom40',
    "name": "干旱监测-40m水平距平",
    'gradient': 'moistureAnom40',
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/forecast/intersucho/2023112700/2023112800/wm_grid_257/{z}/{x}/{y}/awd_0_40-surface.png",
    "models": [{
        "name": "InterSucho",
        "directory": "forecast/intersucho",
        "url": "metadata/v1.0/forecast/intersucho/minifest.json"
    }],
    "levels": ["surface"]
}, {
    'id': 'moistureAnom100',
    "name": "干旱监测-100m水平距平",
    'gradient': 'moistureAnom100',
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/forecast/intersucho/2023112700/2023112800/wm_grid_257/{z}/{x}/{y}/awd_0_100-surface.png",
    "models": [{
        "name": "InterSucho",
        "directory": "forecast/intersucho",
        "url": "metadata/v1.0/forecast/intersucho/minifest.json"
    }],
    "levels": ["surface"]
}, {
    id: 'soilMoisture40',
    name: '干旱监测-40cm土壤湿度',
    gradient: 'soilMoisture',
    'isAccumulations': false,
    "templateUrl": "https://ims.windy.com/im/v3.0/forecast/intersucho/2023112700/2023112800/wm_grid_257/{z}/{x}/{y}/awr_0_40-surface.png",
    "models": [{
        "name": "InterSucho",
        "directory": "forecast/intersucho",
        "url": "metadata/v1.0/forecast/intersucho/minifest.json"
    }],
    "levels": ["surface"]
}, {
    id: 'soilMoisture100',
    name: '干旱监测-100cm土壤湿度',
    gradient: 'soilMoisture',
    'isAccumulations': false,
    "templateUrl": "https://ims.windy.com/im/v3.0/forecast/intersucho/2023112700/2023112800/wm_grid_257/{z}/{x}/{y}/awr_0_100-surface.png",
    "models": [{
        "name": "InterSucho",
        "directory": "forecast/intersucho",
        "url": "metadata/v1.0/forecast/intersucho/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "fwi",
    "name": "火灾危险-火势蔓延",
    "gradient": "fwi",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/forecast/intersucho-firerisk/2023112700/2023112800/wm_grid_257/{z}/{x}/{y}/fwi_genz-surface.png",
    "legend": {
        "discrete": true,
        "colors": ["rgb(75,168,64)", "rgb(234,232,63)", "rgb(236,142,65)", "rgb(220,60,48)", "rgb(162,37,30)", "rgb(131,42,109)"],
        "labels": ["非常低", "低", "中", "高", "很高", "极端"]
    },
    "models": [{
        "name": "FireRisk",
        "directory": "forecast/intersucho-firerisk",
        "url": "metadata/v1.0/forecast/intersucho-firerisk/minifest.json"
    }],
    "levels": ["surface"]
}, {
    "id": "dfm10h",
    "name": "火灾危险-可燃物含水率",
    "gradient": "dfm10h",
    "isAccumulations": false,
    "templateUrl": "https://ims.windy.com/im/v3.0/forecast/intersucho-firerisk/{refTime}/2023112800/wm_grid_257/{z}/{x}/{y}/dfm10h-surface.png",
    "models": [{
        "name": "FireRisk",
        "directory": "forecast/intersucho-firerisk",
        "url": "metadata/v1.0/forecast/intersucho-firerisk/minifest.json"
    }],
    "levels": ["surface"]
}]
