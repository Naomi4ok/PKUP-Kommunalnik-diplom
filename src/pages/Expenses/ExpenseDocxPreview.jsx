import React from 'react';
import moment from 'moment';

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
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
            
            body {
              font-family: 'Roboto', Arial, sans-serif;
              background-color: #f0f0f0;
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
            
            .print-btn, .close-btn {
              background-color: #1890ff;
              color: white;
              border: none;
              border-radius: 4px;
              padding: 8px 16px;
              font-size: 14px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 6px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            
            .close-btn {
              background-color: #ff4d4f;
            }
            
            .print-btn:hover {
              background-color: #40a9ff;
            }
            
            .close-btn:hover {
              background-color: #ff7875;
            }
            
            .print-icon {
              width: 16px;
              height: 16px;
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
            
            .document-page {
              position: relative;
            }
            
            .page-number {
              position: absolute;
              bottom: 10mm;
              right: 10mm;
              font-size: 10pt;
              color: #888;
            }
            
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 60px;
              opacity: 0.05;
              color: #000;
              pointer-events: none;
              text-transform: uppercase;
              white-space: nowrap;
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
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20pt;
              page-break-inside: auto;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
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
            
            .footer {
              margin-top: 20pt;
              font-size: 9pt;
              color: #666;
              text-align: right;
              border-top: 1px solid #eee;
              padding-top: 5pt;
            }
            
            @media print {
              body {
                background: none;
                padding: 0;
              }
              
              .print-actions {
                display: none;
              }
              
              .document-preview {
                width: 100%;
                min-height: auto;
                padding: 0;
                margin: 0;
                box-shadow: none;
              }
              
              .watermark {
                display: none;
              }
              
              @page {
                size: A4;
                margin: 20mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-actions">
            <button class="print-btn" onclick="window.print()">
              <svg class="print-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 8H5C3.34315 8 2 9.34315 2 11V17H6V21H18V17H22V11C22 9.34315 20.6569 8 19 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 3H18V8H6V3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 13.5H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M16 17.5V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Печать
            </button>
            <button class="close-btn" onclick="window.close()">
              <svg class="print-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Закрыть
            </button>
          </div>
          
          <div class="document-preview">
            <div class="document-page">
              
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
              
              <div class="footer">
                Дата формирования отчёта: ${moment().format('DD.MM.YYYY HH:mm')}
                <div class="page-number">Страница 1</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return { openPrintPreview };
};

export default ExpenseDocxPreview;