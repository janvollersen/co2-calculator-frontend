/********************************************
 * Configures data visuals (toggle settings at a given point in time)
 ********************************************/
const DEFAULT_HP = 0; // 0 means not high performance
const DEFAULT_WE = 0; // 0 means not water efficient
const DEFAULT_LANDSCAPING = 0; // 0 means no landscaping
const DEFAULT_ROOF_USAGE = 0; // default is roof is not used at all
const DEFAULT_PV_FOOD_SPLIT = .5; // default half the roof for pv, half for food

// base calculations
let base = {
  capex: 0, // on top
  co2: 0,
  water: 0,
  jobs: 0,
  opex: 0,
  energy: 0,
  food: 0,
};

var building_config = {}; // current building configurations id: config

 // set of building objects
/********************************************
 * Data loading
 ********************************************/
// legacy function. no longer used but kept for recordkeeping and workaorunds.
function parseData(d, val) {
  if (d[val]) {
    return parseFloat(d[val]);
  }
  // log an error here
  console.log('val not found');
  console.log(val)
}

// populate data takes data as json, and makes and returns a json object 'building'
function populate_data(d) {
  var building = {
    use: d.Use,
    name: d.BuildingName,
    base: {
      capex: 0,
      co2: parseData(d, 'CO2EmissionsBase'),
      water: parseData(d, 'WaterBase'),
      jobs: parseData(d, 'JobsBase'),
      opex: parseData(d, 'OpCostBase'),
      energy: parseData(d, 'EnergyBase'),
      food: 0,
    },
    hp: {
      capex: parseData(d, 'InvestmentCostHP'),
      co2: parseData(d, 'CO2EmissionsHighPerformance'),
      water: parseData(d, 'WaterHighPerformance'),
      jobs: parseData(d, 'JobsHighPerformance'),
      opex: parseData(d, 'OpCostHP'),
      energy: parseData(d, 'EnergyHighPerformance'),
    },
    we: {
      capex: parseData(d, 'InvestmentCostWaterEfficient'),
      co2: parseData(d, 'CO2EmissionsWaterEfficient'),
      water: parseData(d, 'WaterWaterEfficient'),
      jobs: parseData(d, 'JobsWaterEfficient'),
      opex: parseData(d, 'OpCostWaterEfficient'),
      energy: parseData(d, 'EnergyWaterEfficient'),
    },
    landscaping: {
      capex: parseData(d, 'InvestmentCostGreenery'),
      co2: parseData(d, 'CO2EmissionsGreenery'),
      water: parseData(d, 'WaterGreenery'),
      jobs: parseData(d, 'JobsGreenery'),
      opex: parseData(d, 'OpCostGreenery'),
      energy: parseData(d, 'EnergyGreenery'),
    },
    pv: {
      capex: parseData(d, 'InvestmentCostPVPanels'),
      co2: parseData(d, 'CO2EmissionsPVPanels'),
      jobs: parseData(d, 'JobsPVPanels'),
      opex: parseData(d, 'OpCostPVPanels'),
      energy: parseData(d, 'EnergyPVPanels'),
    },
    greenhouse: {
      capex: parseData(d, 'InvestmentCostGreenhouse'),
      co2: parseData(d, 'CO2EmissionsGreenhouse'),
      water: parseData(d, 'WaterGreenhouse100'),
      jobs: parseData(d, 'JobsGreenhouse'),
      opex: parseData(d, 'OpCostGreenhouse'),
      energy: parseData(d, 'EnergyGreenhouse'),
      food: parseData(d, 'FoodPercentageGreenhouse100'),
    },
  };
  return building;
}

// makes and returns a json object 'obj', with default values
function populate_building_config(d) {
  var obj = {
    // configuration
    hp: DEFAULT_HP, // high performance
    we: DEFAULT_WE, // water efficient
    landscaping: DEFAULT_LANDSCAPING, // landscaping
    roof_usage: DEFAULT_ROOF_USAGE,
    roof_split: DEFAULT_PV_FOOD_SPLIT,
  };
  return obj;
};

// populates a database with building metrics data, used in renovation controls.
// takes data and a empty json object to be populated. usually used with the object buildings. see './settings.js'
// references base, which is an object containing base-level info about emissions, water use etc. see './settings.js'
export function process_data(data, db) {
  data.forEach(function(d) {
    if (d.BuildingID.length > 3) { // filters out 'test' buildings, which have an id with length < 3. only process actual data
      db[d.BuildingID] = populate_data(d); // calls populate data
      base.co2 += parseFloat(d.CO2EmissionsBase); // sum of water energy and food c02 base
      base.water += parseFloat(d.WaterBase);
      base.jobs += parseFloat(d.JobsBase);
      base.energy += parseFloat(d.EnergyBase);
      base.opex += parseFloat(d.OpCostBase);  // this is sum of food, water energy base
      base.food += parseFloat(d.FoodPercentageBase);
      building_config[d.BuildingID] = populate_building_config(); // calls populate building config
    }
  });
};

// takes a set of buildings and returns an object with the total sum value of each parameter.
export function calculate(selected_buildings, database) {
  var selected_ids = Array.from(selected_buildings); // get the set of selected buildings
  var current = { // initialize the total values object
    capex: calculate_capex(selected_ids, 1, database), // calculates the capex for the selected buildings.
    co2: calculate_co2(selected_ids, 1, database),
    water: calculate_water(selected_ids, 1, database),
    jobs: calculate_jobs(selected_ids, 1, database),
    opex: calculate_opex(selected_ids, 1, database),
    energy: calculate_energy(selected_ids, 1, database),
    food: calculate_food(selected_ids, 1, database),
  };
  return current; // returns the values
};

// formatting function, adds commas where appropriate to large numbers for readability purposes
export function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); //For european separator, change comma to "."
};

/* TODO: get rid of repeated code here */
/* Calculate CO2 and other measures for each building*/
export function calculate_individual(metric, id, include_base, database) {
  var value = 0;
  if (!(include_base)) {
    value += database[id].base[metric];
  }
  value += building_config[id].hp * database[id].hp[metric];
  value += building_config[id].we * database[id].we[metric];
  value += building_config[id].landscaping * database[id].landscaping[metric];
  value += building_config[id].roof_usage * building_config[id].roof_split * database[id].pv[metric];
  value += building_config[id].roof_usage * (1-building_config[id].roof_split) * database[id].greenhouse[metric];
  return value;
};

// calculates the budget of a set of buildings.
// Takes a set of buildings and a true false bit, for whether to include a base value.
// all calculate_ functions are the same format as calculate_capex below. comments can be read similarly.
export function calculate_capex(ids, include_base, database) {
  var capex = 0;
  if (include_base) { // if include_base is true, we add the base value to our budget
    capex = base.capex;
  }
  for (const id of ids) { // for every building in the set of selected buildings, calculate its budget and add that to the total budget
    capex += calculate_individual("capex", id, include_base);
    // if (!(include_base)) {
    //   capex += database[id].base.capex;
    // }
    // capex += building_config[id].hp * database[id].hp.capex;
    // capex += building_config[id].we * database[id].we.capex;
    // capex += building_config[id].landscaping * database[id].landscaping.capex;
    // capex += building_config[id].roof_usage * building_config[id].roof_split * database[id].pv.capex;
    // capex += building_config[id].roof_usage * (1-building_config[id].roof_split) * database[id].greenhouse.capex;
  };
  return capex; // return total budget
};

export function calculate_co2(ids, include_base, database) {
  var co2 = 0;
  if (include_base) {
    co2 = base.co2;
  }
  for (const id of ids) {
    if (!(include_base)) {
      co2 += database[id].base.co2;
    }
    co2 += building_config[id].hp * database[id].hp.co2;
    co2 += building_config[id].we * database[id].we.co2;
    co2 += building_config[id].landscaping * database[id].landscaping.co2;
    co2 += building_config[id].roof_usage * building_config[id].roof_split * database[id].pv.co2;
    co2 += building_config[id].roof_usage * (1-building_config[id].roof_split) * database[id].greenhouse.co2;
  };
  return co2;
};

export function calculate_water(ids, include_base, database) {
  var water = 0;
  if (include_base) {
    water = base.water;
  }
  for (const id of ids) {
    if (!(include_base)) {
      water += database[id].base.water;
    }
    water += building_config[id].hp * database[id].hp.water;
    water += building_config[id].we * database[id].we.water;
    water += building_config[id].landscaping * database[id].landscaping.water;
    water += building_config[id].roof_usage * (1-building_config[id].roof_split) * database[id].greenhouse.water;
  };
  return water;
};

export function calculate_jobs(ids, include_base, database) {
  var jobs = 0;
  if (include_base) {
    jobs = base.jobs;
  }
  for (const id of ids) {
    if (!(include_base)) {
      jobs += database[id].base.jobs;
    }
    jobs += building_config[id].hp * database[id].hp.jobs;
    jobs += building_config[id].we * database[id].we.jobs;
    jobs += building_config[id].landscaping * database[id].landscaping.jobs;
    jobs += building_config[id].roof_usage * building_config[id].roof_split * database[id].pv.jobs;
    jobs += building_config[id].roof_usage * (1-building_config[id].roof_split) * database[id].greenhouse.jobs;
  };
  return jobs;
};

export function calculate_opex(ids, include_base, database) {
  var opex = 0;
  if (include_base) {
    opex = base.opex;
  }
  for (const id of ids) {
    if (!(include_base)) {
      opex += database[id].base.opex;
    }
    opex += building_config[id].hp * database[id].hp.opex;
    opex += building_config[id].we * database[id].we.opex;
    opex += building_config[id].landscaping * database[id].landscaping.opex;
    opex += building_config[id].roof_usage * building_config[id].roof_split * database[id].pv.opex;
    opex += building_config[id].roof_usage * (1-building_config[id].roof_split) * database[id].greenhouse.opex;
  };
  return opex;
}

export function calculate_energy(ids, include_base, database) {
  var energy = 0;
  if (include_base) {
    energy = base.energy;
  }
  for (const id of ids) {
    if (!(include_base)) {
      energy += database[id].base.energy;
    }
    energy += building_config[id].hp * database[id].hp.energy;
    energy += building_config[id].we * database[id].we.energy;
    energy += building_config[id].landscaping * database[id].landscaping.energy;
    energy += building_config[id].roof_usage * building_config[id].roof_split * database[id].pv.energy;
    energy += building_config[id].roof_usage * (1-building_config[id].roof_split) * database[id].greenhouse.energy;
  };
  return energy;
}

export function calculate_food(ids, include_base, database) {
  var food = 0;
  if (include_base) {
    food = base.food;
  }
  for (const id of ids) {
    if (!(include_base)) {
      food += database[id].base.food;
    }
    food += building_config[id].roof_usage * (1-building_config[id].roof_split) * database[id].greenhouse.food;
  };
  return food;
}
