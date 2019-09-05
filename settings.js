// imports functions from './dataprocessing'
import {calculate, numberWithCommas, calculate_energy, calculate_co2,
  calculate_food, calculate_jobs, calculate_opex, calculate_water, calculate_capex} from './dataprocessing'
import {features as resFeatures} from './data/res.json' // imports residential data
import {features as comFeatures} from './data/com.json' // imports commercial data


/********************************************
 * settings.js
 ********************************************/
 // The set of all buildings, as GeoJSON Objects
 // key: id, values:
 // define variables
 var buildings = {}
 var res_b = resFeatures;
 var com_b = comFeatures;
 var all = com_b.concat(res_b);

// Legacy function. Should not be called. Kept for reference and potential workaround.
 function populate(selected_buildings) { // populate the bottom row with correct values
   var values = calculate(selected_buildings);
   document.getElementById("capex").innerHTML = numberWithCommas(Math.round(values.capex/1000)); // in millions
   document.getElementById("co2val").innerHTML = numberWithCommas(Math.round(values.co2/1000)); // kg to tons
   document.getElementById("waterval").innerHTML = numberWithCommas(Math.round(values.water/1000)); // liters to m^3
   document.getElementById("jobsval").innerHTML = numberWithCommas(Math.round(values.jobs));
   document.getElementById("opexval").innerHTML = numberWithCommas(Math.round(values.opex/1000)); // in millions
   document.getElementById("energyval").innerHTML = numberWithCommas(Math.round(values.energy/1000000)); // kWH to gWH
   document.getElementById("foodval").innerHTML = numberWithCommas(Math.round(values.food));
 }


// takes a calculation function
// returns an object with the relevant calculated value for all buildings
 function normalize(calc_func) {
   var numbers = {}; // keeps the calculated results of each building
   for (var i in all) {
     var ls = [all[i].id]; // gets the id of each building (hardcoded for all)
     // returns the actual metric values [co2 emissions, etc] or 0
     var calculated = calc_func(ls, 0) || 0;
     // adds the calculated result to the building's value
     numbers[all[i].id] = +calculated;
   }

   var not_zero = false;
   // FIX BUG: hardcoded large emitter building for Riyadh dataset
   if (numbers['316f1a4c-d98a-430f-b4ec-7f5a0d5e3b21'] > 0) {
     not_zero = true;
   };

   // creates a scale from 0 to 1 of each building's calculated result (energy, water or otherwise)
   // get min and subtract out min from each value
   var min_val = Math.min.apply(null, Object.values(numbers)); // gets the minimum building value
   for (var id in numbers) {
     numbers[id] -= min_val; // subtracts the minimum value from each value in numbers
   }
   // FIX: setting large building's val to 0? so that it doesn't become the max
   numbers['316f1a4c-d98a-430f-b4ec-7f5a0d5e3b21'] = 0;
   // get max building value and divide each value by it, so each number is normalized between 0 and 1.
   var max_val = Math.max.apply(null, Object.values(numbers));
   if (max_val > 0) {
     for (var id in numbers) {
       numbers[id] /= max_val;
     }
   }
   // FIX: set large emitter building value to one, artificially
   if (not_zero) {
     numbers['316f1a4c-d98a-430f-b4ec-7f5a0d5e3b21'] = 1;
   }
   // returns an object which has all of the building's normalized values
   return numbers;
 }

 // converts an rgb color to a hex color, returns a hex value string
 function rgbToHex(r, g, b) {
     return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
 }

// use the value string to display color
 function componentToHex(c) {
     var hex = c.toString(16);
     return hex.length == 1 ? "0" + hex : hex;
 }

 /* Takes a normalized calculated result value
  * Returns an rgb value as a string
  * Maps from orange (244, 190, 66) to red (244, 40, 66)
  */
 function heatMapColorforValue(value) {
   var a=(1-value); // difference between normalized value and 1
   var Y=Math.floor(200*a); // initializes Y depending on a. 200 is interchangeable with a high number ~220, but set by experience.
   var r=244;var g=Y;var b=66; // Sets the 'green' rgb value to Y.
   var str = rgbToHex(r, g, b); // converts the rgb value to a hex string
   return str;
 }

/* Takes a calculation function (example: calculate_co2, calculate_water etc.)
 * Sets the appropriate heatmap color for all buildings in the map
 */
 function heat(calc_func) {
   var normalized = normalize(calc_func); // normalized calculated values
   for (var id in normalized) { // take the id of each building
     let _color = heatMapColorforValue(normalized[id]); // initialize the building's color based on its normalized value
     buildings[id].setStyle({color: _color}); // apply the appropriate color to the building
   }
 }

/*Wrapper functions that call a calculation function from './dataprocessing.js'
*/
 function co2h() {
   heat(calculate_co2)
 }

 function waterh() {
   heat(calculate_water)
 }

 function jobsh() {
   heat(calculate_jobs)
 }

export function opexh() {
   heat(calculate_opex)
}

export function energyh() {
   heat(calculate_energy)
}

export function foodh() {
   heat(calculate_food)
}

export function adjust_buildings(property, val) {
 var ids = Array.from(current_clicked) // because set object not iterable
 ids.forEach( function(id) {
   building_config[id][property] = val;
 })
}

/* Control panel functions
 */

 // high performance
export function toggleHP() {
 toggle(hp, 'hp');
}

// water efficiency
export function togglewater() {
 toggle(water_el, 'we');
}

// landscaping
export function togglegreen() {
 toggle(green, 'landscaping');
}

// toggles the desired value for renovation
export function toggle(obj, property) {
 if (obj.checked == true) {
   adjust_buildings(property, 1);
 } else {
   adjust_buildings(property, 0);
 }
 populate(current_clicked);
}

// slider functions
// used roof space vs not
export function sliderroof() {
 slider('roof_usage', roof.value/100);
}

// PV roof space vs roof garden
export function slidersplit() {
 slider('roof_split', split.value/100);
}

// calls adjust buildings to affect renovation results
export function slider(property, val) {
 adjust_buildings(property, val);
 populate(current_clicked);
}

// changes the selected buildings
export function toggle_building_type(event) {
   if (building_type.value=='all') {
     toggle_all_buildings();
   } else if (building_type.value=='residential') {
     toggle_res();
   } else if (building_type.value=='commercial') {
       toggle_com();
   } else if (building_type.value='none') {
     toggle_none();
   }
 }
