let totalPlayers = 0;
let currentPage = 0;
let $pageSize = $("#pageSize");
$pageSize.val(3);

function getPlayersCount() { //для получения общего количества игроков
    $.get("/rest/players/count", function (count) {
        totalPlayers = count;
        updatePagination();
    });
}

function updatePagination() { //Исходя из общего количества игроков и выставленного количества игроков на странице (3шт) РАЗМЕЩАЕМ кнопки страниц под таблицей
    let pageSize = parseInt($pageSize.val());
    let totalPages = Math.ceil(totalPlayers / pageSize);
    let paginationDiv = $("#pagination");
    paginationDiv.empty();
    paginationDiv.append("Pages:")

    for (let i = 0; i < totalPages; i++) {
        let button = $("<button></button>").text(i + 1);
        if (i === currentPage) {
            button.css("background-color", "#4CAF50");
            button.css("color", "white");
        }
        button.click(function () { // Устанавливаем действие по клику на кнопку
            currentPage = i; // Устанавливаем по клику, что эта страница сейчас выбрана!
            getPlayersList();// Исходя из номера конкретной страницы и выбранного числа игроков на одной странице отображаем игроков на этой странице!
            updatePagination(); // Обновляем подсветку при клике
        });
        paginationDiv.append(button); // Добавляем нужное количество кнопок страниц!
    }
}

function getPlayersList() {
    let pageSize = $pageSize.val();
    //Сервер использует параметры pageNumber и pageSize для вычисления нужного среза данных по формуле:
    //startIndex = pageNumber * pageSize endIndex = startIndex + pageSize
    $.get("/rest/players?pageNumber=" + currentPage + "&pageSize=" + pageSize, function (players) {
        let tbody = $("#playersTable tbody");
        tbody.empty();

        players.forEach(function (player) { // Добавляем в таблицу каждого игрока
            let date = new Date(player.birthday);
            let formattedDate = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();

            let deleteIcon = $("<img>")
                .attr("src", "/img/delete.png")
                .addClass("delete-icon")
                .click(function () {
                    deletePlayer(player.id);
                    getPlayersCount();
                    getPlayersList();
                });
            let editIcon = $("<img>")
                .attr("src", "/img/edit.png")
                .addClass("edit-icon")
                .click(function () {
                    editPlayer(row); //Передаём параметр row даже если он определяется ниже!
                });


            let row = $("<tr></tr>");
            row.append($("<td></td>").text(player.id));
            row.append($("<td></td>").text(player.name));
            row.append($("<td></td>").text(player.title));
            row.append($("<td></td>").text(player.race));
            row.append($("<td></td>").text(player.profession));
            row.append($("<td></td>").text(player.level));
            row.append($("<td></td>").text(formattedDate));
            row.append($("<td></td>").text(player.banned));
            row.append($("<td></td>").append(editIcon));
            row.append($("<td></td>").append(deleteIcon));
            tbody.append(row);
        });
    });
}

function deletePlayer(playerId) { //Функция удаления игрока по его id
    $.ajax({
        url: '/rest/players/' + playerId,
        type: 'DELETE',
        success: function () {
            getPlayersCount();
        }
    });
}

function editPlayer(row) {
    //Находим id игрока в таблице
    let playerId = row.find('td:first').text();
    //Скрываем иконку DELETE
    row.find('.delete-icon').hide();
    //Меняем иконку edit на save
    let editIcon = row.find('.edit-icon');
    editIcon.attr('src', '/img/save.png');

    // Создаём обработчик клика для иконки сохранения: (Когда всё уже изменили - нужно нажать на save)
    /*.off('click') - удаляет все существующие обработчики события "click" с этой иконки. Это нужно, чтобы:
    Очистить старые обработчики, избежать дублирования обработчиков, гарантировать "чистый" старт*/
    /*.on('click', function(){...}) - добавляет новый обработчик клика, который будет:
    Собирать обновленные данные. Отправлять их на сервер. Обновлять интерфейс*/
    editIcon.off('click').on('click', function () {
        let updatedPlayer = {//updatedPlayer собирает все обновленные данные из формы редактирования
            name: row.find('td:eq(1) input').val(), //row.find('td:eq(N)') - находит ячейку таблицы по индексу N
            title: row.find('td:eq(2) input').val(), //.input или .select - ищет внутри ячейки элемент ввода или выпадающий список
            race: row.find('td:eq(3) select').val(), //.val() - получает значение из этого элемента
            profession: row.find('td:eq(4) select').val(),//значение выбранной опции из выпадающего списка
            //level: Math.min(100, Math.max(0, parseInt(row.find('td:eq(5) input').val()) || 0)), // преобразует строковое значение в число через parseInt()
            //birthday: new Date(row.find('td:eq(6) input').val()).getTime(),// преобразует дату в timestamp через new Date().getTime()
            banned: row.find('td:eq(7) select').val() === 'true'
        };//Этот объект затем отправляется на сервер для обновления данных игрока в базе данных.

        // Отправляем POST запрос на сервер для применения новых настроек
        $.ajax({
            url: '/rest/players/' + playerId,
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                name: row.find('td:eq(1) input').val(),
                title: row.find('td:eq(2) input').val(),
                race: row.find('td:eq(3) select').val(),
                profession: row.find('td:eq(4) select').val(),
                banned: row.find('td:eq(7) select').val() === 'true'
            }),
            success: function (response) {
                editIcon.attr('src', '/img/edit.png');
                row.find('.delete-icon').show();
                getPlayersList();
            }
        });
    });

    // Создаем поля для редактирования (Редактируем Игрока!)
    /*Этот селектор явно указывает, какие ячейки можно редактировать:
    td:eq(1) - Name
    td:eq(2) - Title
    td:eq(3) - Race
    td:eq(4) - Profession
    td:eq(7) - Banned*/
    row.find('td:eq(1), td:eq(2), td:eq(3), td:eq(4), td:eq(7)').each(function () {
        let cell = $(this);
        let value = cell.text();
        if (cell.index() === 3) { //  проверяет, является ли текущая ячейка колонкой Race (индекс 3)
            let select = $('<select>'); //- создает новый выпадающий список
            let races = ['HUMAN', 'DWARF', 'ELF', 'GIANT', 'ORC', 'TROLL', 'HOBBIT'];
            races.forEach(function (race) {//для каждой расы из полученного списка:
                let option = $('<option></option>') //создает элемент option
                    .attr('value', race) //устанавливает значение
                    .text(race); //устанавливает отображаемый текст
                if (race === value) {//если это текущая раса игрока
                    option.attr('selected', 'selected'); //делает эту опцию выбранной
                }
                select.append(option);//добавляет option в выпадающий список
            });
            cell.html(select);//помещает выпадающий список в ячейку
            //превращает ячейку Race в выпадающий список с возможными расами, а остальные ячейки - в текстовые поля, birthday, boolean, profession для редактирования.
        } else if (cell.index() === 4) { // Profession column
            let select = $('<select>');
            let professions = ['WARRIOR', 'ROGUE', 'SORCERER', 'CLERIC', 'PALADIN', 'NAZGUL', 'WARLOCK', 'DRUID'];
            professions.forEach(function (profession) {
                let option = $('<option></option>')
                    .attr('value', profession)
                    .text(profession);//устанавливает текст, который будет отображаться в выпадающем списке. Например:<option value="WARRIOR">WARRIOR</option>
                if (profession === value) {
                    option.attr('selected', 'selected');// - если профессии совпадают, делает эту опцию выбранной по умолчанию:<option value="WARRIOR" selected="selected">WARRIOR</option>
                }
                select.append(option);//добавляет готовый элемент option в выпадающий список select
            });
            cell.html(select); //помещает выпадающий список в ячейку таблицы
        } else if (cell.index() === 7) { // Banned column
            let select = $('<select>');
            let options = [false, true];
            options.forEach(function (option) {
                let optionElement = $('<option></option>')
                    .attr('value', option)
                    .text(option);
                if (option.toString() === value) {
                    optionElement.attr('selected', 'selected');
                }
                select.append(optionElement);
            });
            cell.html(select);
        } else {
            cell.html($('<input>').val(value));//или создает текстовое поле с текущим значением
        }
    });
}

$(document).ready(function () {//гарантирует, что код внутри будет выполнен только после полной загрузки DOM-структуры страницы
    getPlayersCount();
    getPlayersList();
    $pageSize.change(function () {//Устанавливается обработчик события change для выпадающего списка #pageSize: При изменении количества игроков на странице:
        currentPage = 0; //currentPage сбрасывается на 0 (первую страницу)
        getPlayersCount(); //пересчитывает количество страниц
        getPlayersList();
    });
    // Добавляем обработчик для кнопки создания игрока
    $("#createPlayer").click(function () {
        let name = $("#playerName").val();
        let title = $("#playerTitle").val();
        let level = parseInt($("#playerLevel").val());
        let birthday = new Date($("#playerBirthday").val()).getTime();

        let minDate = new Date('2000-01-01').getTime();
        let maxDate = new Date('3000-12-31').getTime();


        // Проверяем поля перед созданием игрока
        if (!name) {
            alert("Name field must be filled in!");
            return;
        }
        if (!title) {
            alert("Title field must be filled in!");
            return;
        }
        if (!level) {
            alert("Level should be from 0 to 100");
            return;
        }
        if (level < 0 || level > 100) {
            alert("Level should be from 0 to 100");
            return;
        }
        if (birthday < minDate || birthday > maxDate) {
            alert("Date of birth must be between 2000 and 3000");
            return;
        }


        let newPlayer = {
            name: name,
            title: title,
            race: $("#playerRace").val(),
            profession: $("#playerProfession").val(),
            level: level,
            birthday: birthday,
            banned: $("#playerBanned").val() === 'true'
            //Когда мы получаем значение из select через .val(), оно приходит как строка 'true' или 'false'. Оператор === сравнивает значение со строкой 'true' и возвращает true или false.
        };

        $.ajax({//$.ajax() - метод jQuery для выполнения асинхронного HTTP запроса
            url: '/rest/players', //адрес endpoint'а на сервере
            type: 'POST', //HTTP метод для создания нового ресурса
            contentType: 'application/json',// указывает серверу, что отправляем JSON
            /*application - указывает, что содержимое относится к программным данным json - указывает конкретный формат этих данных (JavaScript Object Notation)*/
            data: JSON.stringify(newPlayer),//преобразует объект newPlayer в JSON строку
            success: function (response) {//функция, которая выполнится после успешного ответа сервера:
                // Очищаем поля
                $("#playerName").val('');//Очищает все поля формы через .val('')
                $("#playerTitle").val('');
                $("#playerRace").val('HUMAN');//Устанавливает значения по умолчанию для select'ов (HUMAN, WARRIOR, false)
                $("#playerProfession").val('WARRIOR');
                $("#playerLevel").val('');
                $("#playerBirthday").val('');
                $("#playerBanned").val('false');

                // Обновляем список игроков
                getPlayersCount(); //для обновления общего количества игроков
                getPlayersList(); //для обновления таблицы с игроками
            }
        });
    });
});