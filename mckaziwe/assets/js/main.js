var statementNo = 0;
var statmentStage = 0;
var index = 0;
$(document).ready(function() {
  const text = $('#dynamic-text'); // where text is displayed
  let sentence0 = ['B', 'r', 'e', 'a', 't', 'h', 'i', 'n', 'g',' ', 'i', 'n', ' ', 'y', 'o', 'u', 'r', ' ', 'm', 'o', 'm', 'e', 'n', 't'];
  // Creation and destruction of tags

  function write(len, sentence){
    if(index < len){
      // writting
      let span = document.createElement('span');
      span.innerHTML = sentence[index];
      span.id = "id"+index;
      span.classList.add("d-text");
      span.classList.add("hidden");
      text.append(span);
      span.classList.remove("hidden");
      span.classList.add("animate");
      index++;
    } else if(index >= len && index < 2*len){
      // deleting
        
        if (index == len) {
          setTimeout(function(){
            $("#id"+(len - (index - len) - 1)).remove();
            index++;
          }, 1200);
        } else {
            $("#id"+(len - (index - len) - 1)).remove();
            index++;
        }
        
    } else{
      statementNo++;
      index = 0;
      
    }
      
  }

  function print() {
    // I specifis which statement we are working on
    if (statementNo == 0) {
      // statment 0
      let len = sentence0.length;
      write(len, sentence0);

    } else{
        statementNo = 0;
        statmentStage = 0;
    }
  }
  
  var r = setInterval(print, 230, window.column);
  
  // text.innerHTML += sentence[window.row][window.column];
})
