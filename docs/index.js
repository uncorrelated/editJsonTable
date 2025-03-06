// for local debugging, avoiding the CORS error
var json_string = '[{ "delete": 0, "id": 1, "name": "scott", "type": "A", "update": 0}, {"id": 2, "name": "tiger", "type": "B", "delete": 0, "update": 0}]';

var colnames = ["id", "name", "type", "delete", "update"];
var colupdate = "update"; // the column set to 1 when something is changed.
var colid = "id";
var types = ["invariable", "text", "select", "toggle", "toggle"];
var options = {"type": ["A", "B", "C"]};
var default_values = ["", "", "A", 0, 1];

var form = document.getElementsByTagName('form')[0];
form.addEventListener("submit", (event) => { return false; });

var input = document.createElement('input');
input.style.visibility = "hidden";
input.style.border = input.style.padding = 0;
input.style.position = "absolute";
form.append(input);

var select = document.createElement('select');
select.style.visibility = "hidden";
select.style.border = select.style.padding = 0;
select.style.position = "absolute";
form.append(select);

function setOptions(colname){
   var old_options = select.getElementsByTagName("option");
   for(var i = old_options.length - 1; i >= 0 ; i--){
      select.removeChild(old_options[i]);
   }
   for(var i = 0; i < options[colname].length; i++){
      var option = document.createElement('option');
      option.label = option.value = options[colname][i];
      select.appendChild(option);
   }
}

function moveInput(input, elm){
   var domRect = elm.getBoundingClientRect();
   input.style.width = parseInt(domRect["width"]) + "px";
   input.style.height = domRect["height"] + "px";
   input.style.top = domRect["top"] + "px";
   input.style.left = domRect["left"] + "px";
}

function updateJSON(){
   textarea.value = JSON.stringify(table_to_array());
}

function toggleFlag(elm){
   elm.textContent = (parseInt(elm.textContent) + 1) % 2;
   updateJSON();
}

function flagChanged(elm){
   tr = elm.parentElement;
   tds = tr.getElementsByTagName("td");
   for(var i=0; i<tds.length; i++){
      if(tds[i]!=elm && colupdate == colnames[i]){
         tds[i].textContent = 1;
      }
   }
   updateJSON();
}

function moveNext(elm, direction){
   // focus on the next input-text/select datum.
   function step(elm, direction){
      return !direction ? elm.nextElementSibling : elm.previousElementSibling;
   }
   var tr = elm.parentElement;
   var td = elm;
   var ctype = td.getAttribute("col.type");
   for(var j = 0; j < colnames.length; j++){
      td = step(td, direction);
      if(undefined == td){
         tr = step(tr, direction);
         if(undefined == tr){
            var elm = table;
            while(undefined != (elm = step(elm, direction))){
               if(input == elm || select == elm) continue;
               if("input" == elm.tagName || "select" == elm.tagName){
                  elm.focus();
                  return;
               }
            }
            return;
         }
         td = tr.getElementsByTagName("td")[!direction ? 0 : colnames.length - 1];
      }
      if(undefined == td) return;
      var type = td.getAttribute("col.type");
      if(ctype == type){
         if("text" == type){
            editText(td);
            break;
         } else if("select" == type){
            chooseOption(td);
            break;
         }
      }
   }
}



function editText(elm){
   moveInput(input, elm);

   function blurListener(e){
      input.removeEventListener("blur", blurListener);
      if(input.value != elm.textContent){
         elm.textContent = input.value;
         flagChanged(elm);
      }
      input.style.visibility = "hidden";
   }
   input.addEventListener("blur", blurListener);

   function keydownListener(e){
      if(e.key == "Enter" || e.key == "Tab"){
         input.removeEventListener("keydown", keydownListener);
         e.preventDefault();
         input.blur();
         moveNext(elm, e.shiftKey);
      }
   }
   input.addEventListener("keydown", keydownListener);

   input.value = elm.textContent;
   input.style.visibility = "visible";
   input.focus();

}

function chooseOption(elm){
   moveInput(select, elm);
   setOptions(elm.getAttribute("col.name"));

   function blurListener(e){
      select.removeEventListener("blur", blurListener);
      if(0 < select.selectedOptions.length){
         var new_value = select.options[select.selectedIndex].value;
         if(elm.textContent != new_value){
            elm.textContent = new_value;
            flagChanged(elm);
         }
      }
      select.style.visibility = "hidden";
   }
   select.addEventListener("blur", blurListener);

   function changeListener(e){
      select.removeEventListener("change", changeListener);
      select.blur();
      moveNext(elm, e.shiftKey);
   }
   select.addEventListener("change", changeListener);

   for(var i = 0; i < select.length; i++){
      select.options[i].selected = (select.options[i].value == elm.textContent);
   }
   select.style.visibility = "visible";
   select.focus();
}

function edit(e){
   var elm = document.elementFromPoint(e.pageX, e.pageY);
   var type = elm.getAttribute("col.type");
   if("toggle" == type){
      toggleFlag(elm);
   } else if("text" == type){
      editText(elm);
   } else if("select" == type){
      chooseOption(elm);
   }
}

function table_to_array(){
   var trs = tbody.getElementsByTagName("tr");
   r = [];
   var k = 0;
   for(var i=0; i<trs.length; i++){
      var tr = trs[i];
      var tds = tr.getElementsByTagName("td");
      if(tds.length < colnames.length) continue;
      var row = {};
      var id;
      for(var j=0; j<tds.length; j++){
         row[colnames[j]] = tds[j].textContent;
      }
      r[k++] = row;
   }
   return r;
}

function array_to_table(a){
   var trs = tbody.getElementsByTagName("tr");
   // trs[0] is the row of labels.
   for(var i=trs.length-1; i>0; i--){
      tbody.removeChild(trs[i]);
   }
   for(var i = 0; i < a.length; i++){
      var tr = document.createElement('tr');
      for(var j = 0; j < colnames.length; j++){
         var td = document.createElement('td');
         td.textContent = a[i][colnames[j]];
         td.setAttribute("col.type", types[j]);
         td.setAttribute("col.name", colnames[j]);
         td.addEventListener("click", edit);
         tr.appendChild(td);
      }
      tbody.appendChild(tr);
   }
}

var table = form.getElementsByTagName('table')[0];
var tbody = form.getElementsByTagName('tbody')[0];
if(undefined == tbody){
   table.appendChild(tbody = document.createElement('tbody'));
}

var tr = document.createElement('tr');
for(var i = 0; i < colnames.length; i++){
   var th = document.createElement('th');
   th.textContent = colnames[i]
   tr.appendChild(th);
}
tbody.appendChild(tr);

function loadJSON(uri){
   var req = new XMLHttpRequest();
   req.onreadystatechange = function() {
      if (req.readyState == 4) {
         if(req.status == 200){
            array_to_table(JSON.parse(req.responseText));
         } else {
            // for local debugging, avoiding the CORS error
            array_to_table(JSON.parse(json_string));
         }
         textarea.value = JSON.stringify(table_to_array());
      } else {
      }
   }
   req.open('GET', uri, true);
   req.send(null);
}

var button_a = document.createElement("input");
button_a.setAttribute("type", "button");
button_a.value = "add a row";
button_a.addEventListener("click", (e) => {
   var tr = document.createElement('tr');
   for(var i = 0; i < colnames.length; i++){
      var td = document.createElement('td');
      td.textContent = default_values[i];
      td.setAttribute("col.type", types[i]);
      td.addEventListener("click", edit);
      tr.appendChild(td);
   }
   tbody.appendChild(tr);
   updateJSON();
})
form.append(button_a);

var button_b = document.createElement("input");
button_b.setAttribute("type", "button");
button_b.value = "cancel the latest added row";
button_b.addEventListener("click", (e) => {
   var trs = tbody.getElementsByTagName("tr");
   if(0<trs.length){
      var tr = trs[trs.length - 1];
      var tds = tr.getElementsByTagName("td");
      for(var i=0; i<tds.length;i++){
         if(colid != colnames[i]) continue;
         if("" == tds[i].textContent){
            tbody.removeChild(tr);
            break;
         }
      }
   }
   updateJSON();
})
form.append(button_b);

var textarea = document.createElement("textarea");
form.append(textarea);

loadJSON("./index.json");
