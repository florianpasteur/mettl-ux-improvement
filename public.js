function findAllBySelector(selector, _document = document) {
    return Array.from(_document.querySelectorAll(selector))
}

function setLastQuestionMCA(tags, row) {
    const [
        question,
        answer1,
        answer2,
        answer3,
        answer4,
        correctAnswers,
    ] = row.split('\t');

    const correctAnswersIndexes = correctAnswers.split(',').map(r => r.trim()).map(response => {
        switch (response.toLowerCase()) {
            case 'a':  return 0;
            case 'b':  return 1;
            case 'c':  return 2;
            case 'd':  return 3;
        }
    });

    const inputText = findAllBySelector('*[contenteditable="true"]').slice(-6).slice(0,5);

    const checkboxes = findAllBySelector('*[type="checkbox"]').slice(-6).slice(0,4);

    inputText[0].innerHTML = `<div>${question}</div>`;
    inputText[1].innerHTML = `<div>${answer1}</div>`;
    inputText[2].innerHTML = `<div>${answer2}</div>`;
    inputText[3].innerHTML = `<div>${answer3}</div>`;
    inputText[4].innerHTML = `<div>${answer4}</div>`;

    checkboxes.forEach(checkbox => {
        checkbox.removeAttribute('checked')
    })
    correctAnswersIndexes.forEach(index => {
        checkboxes[index].setAttribute('checked', 'checked')
    })

    /*  findAllBySelector('.question-custom-tag').slice(-1)[0].innerHTML =
      tags.map(tag => `<li class="question-tagName _question-tagName" data-id="${tag}"><span class="_qt-custom">${tag}</span><small class="close _qt-close"><img src="//static.mettl.com/resources/images/cross.svg" alt="Cross"></small></li>`)
  */
}
