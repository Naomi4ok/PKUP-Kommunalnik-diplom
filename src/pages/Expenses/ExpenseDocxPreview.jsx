import React from 'react';
import moment from 'moment';
import { Button } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';

/**
 * Компонент для предпросмотра отчета о расходах
 * @param {Object} props - Свойства компонента
 * @param {Array} props.filteredExpenses - Отфильтрованные расходы
 * @param {Array} props.dateRange - Выбранный диапазон дат
 * @param {boolean} props.includeSummary - Флаг включения сводной информации
 * @param {boolean} props.includeDetails - Флаг включения детализации расходов
 * @param {Array} props.selectedColumns - Выбранные колонки для отображения
 * @param {Function} props.getResourceTypeDisplayName - Функция получения отображаемого имени типа ресурса
 * @param {Function} props.getResourceName - Функция получения имени ресурса
 * @param {Function} props.formatCurrency - Функция форматирования валюты
 */
const ExpenseDocxPreview = ({
  filteredExpenses,
  dateRange,
  includeSummary,
  includeDetails,
  selectedColumns,
  getResourceTypeDisplayName,
  getResourceName,
  formatCurrency
}) => {
  // Рассчитываем общую сумму расходов
  const total = filteredExpenses.reduce((sum, expense) => sum + (expense.Amount || 0), 0);
  
  // Группировка по типу ресурса
  const resourceTypeSummary = {};
  filteredExpenses.forEach(expense => {
    const typeName = getResourceTypeDisplayName(expense.Resource_Type);
    if (!resourceTypeSummary[typeName]) {
      resourceTypeSummary[typeName] = 0;
    }
    resourceTypeSummary[typeName] += expense.Amount || 0;
  });
  
  // Группировка по категории
  const categorySummary = {};
  filteredExpenses.forEach(expense => {
    const category = expense.Category || 'Без категории';
    if (!categorySummary[category]) {
      categorySummary[category] = 0;
    }
    categorySummary[category] += expense.Amount || 0;
  });

  // Открываем новое окно для предпросмотра
  const openPrintPreview = () => {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      console.error('Открытие окна предварительного просмотра заблокировано.');
      return;
    }
    
    // Генерируем HTML контент
    printWindow.document.write(`
      <html>
        <head>
          <title>Отчёт о расходах</title>
          <style>
            /* Подключаем шрифт Times New Roman */
            @font-face {
              font-family: 'Times New Roman';
              src: local('Times New Roman');
              font-weight: normal;
              font-style: normal;
            }
            
            /* Применяем Times New Roman ко всему документу */
            body, h1, h2, h3, p, table, th, td, .footer, .date-range, .summary-info {
              font-family: 'Times New Roman', Times, serif;
            }
            
            body {
              padding: 20px;
              margin: 0;
              box-sizing: border-box;
            }
            
            .print-actions {
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: 1000;
              display: flex;
              gap: 10px;
            }
            
            /* Стилизуем кнопки в стиле Ant Design */
            .ant-btn {
              line-height: 1.5715;
              position: relative;
              display: inline-block;
              font-weight: 400;
              white-space: nowrap;
              text-align: center;
              background-image: none;
              border: 1px solid transparent;
              box-shadow: 0 2px 0 rgba(0, 0, 0, 0.015);
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
              user-select: none;
              touch-action: manipulation;
              height: 32px;
              padding: 4px 15px;
              font-size: 14px;
              border-radius: 2px;
              color: rgba(0, 0, 0, 0.85);
              border-color: #d9d9d9;
              background: #fff;
            }

            .ant-btn-primary {
              color: #fff;
              border-color: #1890ff;
              background: #1890ff;
              text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.12);
              box-shadow: 0 2px 0 rgba(0, 0, 0, 0.045);
            }

            .ant-btn-primary:hover {
              color: #fff;
              border-color: #40a9ff;
              background: #40a9ff;
            }

            .ant-btn-dangerous {
              color: #ff4d4f;
              border-color: #ff4d4f;
              background: #fff;
            }

            .ant-btn-dangerous:hover {
              color: #fff;
              border-color: #ff4d4f;
              background: #ff4d4f;
            }

            .ant-btn-icon-only {
              width: 32px;
              height: 32px;
              padding: 2.4px 0;
              font-size: 16px;
              border-radius: 2px;
            }

            .ant-btn > .anticon {
              line-height: 1;
            }
            
            .document-preview {
              width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              margin: 0 auto;
              background-color: white;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
              position: relative;
              box-sizing: border-box;
            }
            
            /* Изменения для правильной разбивки на страницы */
            .document-page {
              position: relative;
              min-height: calc(297mm - 40mm); /* Высота A4 минус отступы */
              padding-bottom: 20mm;  /* Пространство для колонтитула */
              margin-bottom: 10mm;   /* Отступ между страницами в предпросмотре */
              page-break-after: always; /* Обязательное разделение страниц при печати */
            }
            
            /* Последняя страница не должна иметь разрыва после себя */
            .document-page:last-child {
              page-break-after: auto;
              margin-bottom: 0;
            }
            
            /* Стиль для нижнего колонтитула */
            .page-footer {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 15mm;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid #eee;
              padding-top: 3mm;
            }
            
            .report-date {
              font-size: 9pt;
              color: #666;
            }
            
            .page-number {
              font-size: 10pt;
              color: #888;
            }
            
            h1 {
              font-size: 22pt;
              text-align: center;
              margin-top: 0;
              margin-bottom: 10pt;
              font-weight: 700;
              color: #333;
            }
            
            .date-range {
              font-size: 12pt;
              text-align: center;
              margin-bottom: 20pt;
              color: #555;
            }
            
            h2 {
              font-size: 16pt;
              margin-top: 25pt;
              margin-bottom: 15pt;
              page-break-after: avoid;
              color: #444;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5pt;
            }
            
            h3 {
              font-size: 14pt;
              margin-top: 20pt;
              margin-bottom: 10pt;
              page-break-after: avoid;
              color: #555;
            }
            
            .summary-info {
              margin-bottom: 15pt;
              font-size: 12pt;
            }
            
            /* Улучшенные стили для таблиц и возможности переноса */
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20pt;
              page-break-inside: auto; /* Разрешаем разрыв таблицы */
            }
            
            /* Заголовок таблицы не должен разрываться */
            thead {
              display: table-header-group; /* Повторять заголовок таблицы на каждой странице */
              page-break-inside: avoid;
            }
            
            /* Разделение ячеек и строк */
            tr {
              page-break-inside: avoid; /* Избегаем разрыва внутри строки */
              page-break-after: auto;
            }
            
            /* Если таблица разбивается между страницами, повторять заголовок */
            tfoot {
              display: table-footer-group;
            }
            
            /* Стили ячеек */
            th, td {
              border: 1px solid #ddd;
              padding: 8pt;
              text-align: left;
              font-size: 10pt;
            }
            
            th {
              background-color: #f8f8f8;
              font-weight: 600;
              color: #333;
            }
            
            tbody tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            /* Стили для печати */
            @page {
              size: A4;
              margin: 0mm;
            }
            
            @media print {
              html, body {
                width: 210mm;
                height: 297mm;
                background: none;
                padding: 0;
                margin: 0;
              }
              
              .print-actions {
                display: none; /* Скрываем кнопки при печати */
              }
              
              .document-preview {
                width: 100%;
                height: auto;
                min-height: auto;
                padding: 20mm;
                margin: 0;
                box-shadow: none;
              }
              
              /* Обеспечиваем, чтобы каждая страница корректно отображалась */
              .document-page {
                height: calc(297mm - 40mm); /* Фиксированная высота страницы при печати */
                page-break-after: always;
                margin-bottom: 0; /* Убираем отступ между страницами при печати */
              }
              
              /* Последняя страница не должна иметь разрыва после себя */
              .document-page:last-child {
                page-break-after: auto;
              }
              
              /* Сохраняем стили таблиц при печати */
              th {
                background-color: #f8f8f8 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              tbody tr:nth-child(even) {
                background-color: #f9f9f9 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              /* Колонтитул должен быть внизу каждой страницы */
              .page-footer {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                border-top: 1px solid #eee;
                background-color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              /* Отображение заголовков таблиц на каждой странице */
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
            }
          </style>
          
          <!-- Скрипт для формирования страниц и печати -->
          <script>
            function splitContentIntoPages() {
              const maxHeight = 257; // Высота страницы в мм минус отступы и место для колонтитула
              const container = document.querySelector('.document-preview');
              const contents = document.querySelectorAll('h1, h2, h3, p, table');
              
              // Очищаем контейнер
              container.innerHTML = '';
              
              // Создаем первую страницу
              let currentPage = document.createElement('div');
              currentPage.className = 'document-page';
              let pageNumber = 1;
              
              // Добавляем все элементы на страницы
              for (let i = 0; i < contents.length; i++) {
                // Клонируем элемент
                const element = contents[i].cloneNode(true);
                
                // Добавляем элемент на текущую страницу
                currentPage.appendChild(element);
                
                // Проверяем, не превышает ли высота макс. значение
                const elementHeight = element.offsetHeight;
                
                // Если это таблица и она слишком большая
                if (element.tagName === 'TABLE' && elementHeight > maxHeight) {
                  // Обрабатываем большие таблицы отдельно
                  handleLargeTable(element, currentPage, container, maxHeight, pageNumber);
                  pageNumber++;
                  
                  // Создаем новую страницу для следующего контента
                  currentPage = document.createElement('div');
                  currentPage.className = 'document-page';
                } 
                else if (currentPage.offsetHeight > maxHeight * 3.7795275591) { // Конвертируем мм в пиксели (примерно)
                  // Добавляем колонтитул к текущей странице
                  addFooter(currentPage, pageNumber);
                  pageNumber++;
                  
                  // Добавляем страницу в контейнер
                  container.appendChild(currentPage);
                  
                  // Создаем новую страницу и добавляем туда текущий элемент
                  currentPage = document.createElement('div');
                  currentPage.className = 'document-page';
                  currentPage.appendChild(element.cloneNode(true));
                }
              }
              
              // Добавляем колонтитул к последней странице
              addFooter(currentPage, pageNumber);
              
              // Добавляем последнюю страницу в контейнер
              container.appendChild(currentPage);
            }
            
            function handleLargeTable(table, page, container, maxHeight, pageNumber) {
              // Получаем все строки таблицы
              const rows = table.querySelectorAll('tr');
              const header = table.querySelector('thead').cloneNode(true);
              
              // Создаем новую таблицу для текущей страницы
              let currentTable = document.createElement('table');
              currentTable.appendChild(header.cloneNode(true));
              
              let tbody = document.createElement('tbody');
              currentTable.appendChild(tbody);
              
              // Заменяем оригинальную таблицу на эту новую таблицу
              page.replaceChild(currentTable, table);
              
              // Добавляем строки в текущую таблицу, пока не превысим высоту
              for (let i = header.querySelectorAll('tr').length; i < rows.length; i++) {
                const row = rows[i].cloneNode(true);
                tbody.appendChild(row);
                
                // Если высота превышена, создаем новую страницу и таблицу
                if (page.offsetHeight > maxHeight * 3.7795275591) { // Конвертируем мм в пиксели (примерно)
                  // Удаляем последнюю добавленную строку
                  tbody.removeChild(row);
                  
                  // Добавляем колонтитул к текущей странице
                  addFooter(page, pageNumber);
                  pageNumber++;
                  
                  // Добавляем страницу в контейнер
                  container.appendChild(page);
                  
                  // Создаем новую страницу
                  page = document.createElement('div');
                  page.className = 'document-page';
                  
                  // Создаем новую таблицу с тем же заголовком
                  currentTable = document.createElement('table');
                  currentTable.appendChild(header.cloneNode(true));
                  
                  tbody = document.createElement('tbody');
                  currentTable.appendChild(tbody);
                  
                  // Добавляем таблицу на новую страницу
                  page.appendChild(currentTable);
                  
                  // Добавляем строку, которую не смогли добавить на предыдущую страницу
                  tbody.appendChild(row);
                }
              }
              
              // Возвращаем последнюю созданную страницу
              return { page, pageNumber };
            }
            
            function addFooter(page, pageNumber) {
              const footer = document.createElement('div');
              footer.className = 'page-footer';
              footer.innerHTML = \`
                <span class="report-date">Дата формирования отчёта: ${moment().format('DD.MM.YYYY HH:mm')}</span>
                <span class="page-number">\${pageNumber}</span>
              \`;
              page.appendChild(footer);
            }
            
            function printDocument() {
              // Сначала разделяем контент на страницы
              splitContentIntoPages();
              
              // Затем печатаем
              setTimeout(() => {
                window.print();
              }, 300);
              
              return false;
            }
            
            // Инициализируем разделение контента при загрузке
            window.onload = function() {
              // Создаем начальное содержимое
              createInitialContent();
              // Разделяем на страницы
              splitContentIntoPages();
            };
            
            function createInitialContent() {
              const container = document.querySelector('.document-preview');
              container.innerHTML = \`
                <h1>Отчёт о расходах</h1>
                <p class="date-range">За период: ${dateRange[0].format('DD.MM.YYYY')} - ${dateRange[1].format('DD.MM.YYYY')}</p>
                
                ${includeSummary ? `
                  <h2>Сводная информация</h2>
                  <p class="summary-info"><strong>Общая сумма расходов:</strong> ${formatCurrency(total)}</p>
                  
                  <h3>Расходы по типам ресурсов</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Тип ресурса</th>
                        <th>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${Object.entries(resourceTypeSummary).map(([type, amount]) => `
                        <tr>
                          <td>${type}</td>
                          <td>${formatCurrency(amount)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  
                  <h3>Расходы по категориям</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Категория</th>
                        <th>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${Object.entries(categorySummary).map(([category, amount]) => `
                        <tr>
                          <td>${category}</td>
                          <td>${formatCurrency(amount)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                ` : ''}
                
                ${includeDetails ? `
                  <h2>Детализация расходов</h2>
                  <table>
                    <thead>
                      <tr>
                        ${selectedColumns.includes('date') ? '<th>Дата</th>' : ''}
                        ${selectedColumns.includes('resourceType') ? '<th>Тип ресурса</th>' : ''}
                        ${selectedColumns.includes('resource') ? '<th>Ресурс</th>' : ''}
                        ${selectedColumns.includes('category') ? '<th>Категория</th>' : ''}
                        ${selectedColumns.includes('amount') ? '<th>Сумма</th>' : ''}
                        ${selectedColumns.includes('description') ? '<th>Описание</th>' : ''}
                        ${selectedColumns.includes('paymentMethod') ? '<th>Способ оплаты</th>' : ''}
                        ${selectedColumns.includes('invoiceNumber') ? '<th>Номер счета</th>' : ''}
                      </tr>
                    </thead>
                    <tbody>
                      ${filteredExpenses.map(expense => `
                        <tr>
                          ${selectedColumns.includes('date') ? `<td>${moment(expense.Date).format('DD.MM.YYYY')}</td>` : ''}
                          ${selectedColumns.includes('resourceType') ? `<td>${getResourceTypeDisplayName(expense.Resource_Type)}</td>` : ''}
                          ${selectedColumns.includes('resource') ? `<td>${getResourceName(expense.Resource_Type, expense.Resource_ID)}</td>` : ''}
                          ${selectedColumns.includes('category') ? `<td>${expense.Category || ''}</td>` : ''}
                          ${selectedColumns.includes('amount') ? `<td>${formatCurrency(expense.Amount)}</td>` : ''}
                          ${selectedColumns.includes('description') ? `<td>${expense.Description || ''}</td>` : ''}
                          ${selectedColumns.includes('paymentMethod') ? `<td>${expense.Payment_Method || ''}</td>` : ''}
                          ${selectedColumns.includes('invoiceNumber') ? `<td>${expense.Invoice_Number || ''}</td>` : ''}
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                ` : ''}
              \`;
            }
          </script>
        </head>
        <body>
          <div class="print-actions">
            <button class="ant-btn ant-btn-primary" onclick="return printDocument()">
              <span class="anticon" style="margin-right: 8px;">
                <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                  <path d="M732 120c0-4.4-3.6-8-8-8H300c-4.4 0-8 3.6-8 8v148h440V120zm120 212H172c-44.2 0-80 35.8-80 80v328c0 17.7 14.3 32 32 32h168v132c0 4.4 3.6 8 8 8h424c4.4 0 8-3.6 8-8V772h168c17.7 0 32-14.3 32-32V412c0-44.2-35.8-80-80-80zM664 844H360V568h304v276zm164-360c0 4.4-3.6 8-8 8h-40c-4.4 0-8-3.6-8-8v-40c0-4.4 3.6-8 8-8h40c4.4 0 8 3.6 8 8v40z"></path>
                </svg>
              </span>
              Печать
            </button>
            <button class="ant-btn ant-btn-dangerous" onclick="window.close()">
              <span class="anticon" style="margin-right: 8px;">
                <svg viewBox="64 64 896 896" focusable="false" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                  <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
                </svg>
              </span>
              Закрыть
            </button>
          </div>
          
          <div class="document-preview">
            <!-- Содержимое будет добавлено с помощью скрипта splitContentIntoPages -->
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return { openPrintPreview };
};

export default ExpenseDocxPreview;