import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Button,
  Select,
  Card,
  Typography,
  message,
  Breadcrumb,
  Space,
  Tabs,
  Row,
  Col,
  Spin,
  Table,
  Checkbox,
  Collapse
} from 'antd';
import {
  HomeOutlined,
  FileWordOutlined,
  ArrowLeftOutlined,
  PrinterOutlined,
  SettingOutlined,
  FileTextOutlined,
  TableOutlined,
  FilterOutlined
} from '@ant-design/icons';
import moment from 'moment';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';
import '../../styles/Expenses/ExpenseDocx.css';

// Импортируем библиотеку для создания docx документов
// Импортируем библиотеку для создания docx документов
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table as DocxTable, 
  TableRow, 
  TableCell, 
  TextRun, 
  HeadingLevel, 
  BorderStyle, 
  AlignmentType, 
  Header, 
  Footer, 
  PageNumber, 
  WidthType, 
  TableLayoutType 
} from 'docx';
import { saveAs } from 'file-saver';

// Импортируем компонент для предпросмотра
import ExpenseDocxPreview from './ExpenseDocxPreview';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const ExpenseDocx = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [resourceOptions, setResourceOptions] = useState({
    employees: [],
    equipment: [],
    transportation: [],
    tools: [],
    spares: [],
    materials: []
  });
  const [dateRange, setDateRange] = useState([moment().startOf('month'), moment()]);
  const [selectedColumns, setSelectedColumns] = useState([
    'date', 'resourceType', 'resource', 'category', 'amount'
  ]);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [filterValues, setFilterValues] = useState({
    resourceTypes: [],
    categories: []
  });
  const [activeTab, setActiveTab] = useState('1');

  // Fetch all required data on component mount
  useEffect(() => {
    Promise.all([
      fetchExpenses(),
      fetchExpenseCategories(),
      fetchResourceOptions()
    ]).then(() => {
      setInitialLoading(false);
    }).catch(error => {
      message.error(`Ошибка при загрузке данных: ${error.message}`);
      setInitialLoading(false);
    });
  }, []);

  // Update filtered expenses when expenses change or filters change
  useEffect(() => {
    applyFilters();
  }, [expenses, dateRange, filterValues]);

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/expenses');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setExpenses(data);
      return data;
    } catch (err) {
      message.error(`Не удалось загрузить данные о расходах: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch expense categories
  const fetchExpenseCategories = async () => {
    try {
      const response = await fetch('/api/expenses/categories/all');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setCategories(data.map(c => c.Name));
      return data;
    } catch (err) {
      message.error(`Не удалось загрузить категории расходов: ${err.message}`);
      return [];
    }
  };

  // Fetch all resource options
  const fetchResourceOptions = async () => {
    try {
      // Fetch all resource types in parallel
      const [employees, equipment, transportation, tools, spares, materials] = await Promise.all([
        fetch('/api/employees').then(res => res.json()),
        fetch('/api/equipment').then(res => res.json()),
        fetch('/api/transportation').then(res => res.json()),
        fetch('/api/tools').then(res => res.json()),
        fetch('/api/spares').then(res => res.json()),
        fetch('/api/materials').then(res => res.json())
      ]);
      
      setResourceOptions({
        employees,
        equipment,
        transportation,
        tools,
        spares,
        materials
      });
      return { employees, equipment, transportation, tools, spares, materials };
    } catch (err) {
      message.error(`Не удалось загрузить данные о ресурсах: ${err.message}`);
      return null;
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('BY', {
      style: 'currency',
      currency: 'BYN',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  // Get resource name by type and id
  const getResourceName = (type, id) => {
    if (!id) return '-';
    
    switch(type) {
      case 'Employee':
        return resourceOptions.employees.find(e => e.Employee_ID === id)?.Full_Name || `ID: ${id}`;
      case 'Equipment':
        return resourceOptions.equipment.find(e => e.Equipment_ID === id)?.Name || `ID: ${id}`;
      case 'Transportation':
        return resourceOptions.transportation.find(t => t.Transport_ID === id)?.Brand + ' ' + 
               resourceOptions.transportation.find(t => t.Transport_ID === id)?.Model || `ID: ${id}`;
      case 'Tool':
        return resourceOptions.tools.find(t => t.Tool_ID === id)?.Name || `ID: ${id}`;
      case 'Spare':
        return resourceOptions.spares.find(s => s.Spare_ID === id)?.Name || `ID: ${id}`;
      case 'Material':
        return resourceOptions.materials.find(m => m.Material_ID === id)?.Name || `ID: ${id}`;
      default:
        return `${type} ID: ${id}`;
    }
  };

  // Get resource type display name
  const getResourceTypeDisplayName = (type) => {
    const typeMap = {
      'Employee': 'Сотрудник',
      'Equipment': 'Оборудование',
      'Transportation': 'Транспорт',
      'Tool': 'Инструмент',
      'Spare': 'Запчасть',
      'Material': 'Материал'
    };
    return typeMap[type] || type;
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, values) => {
    setFilterValues(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  // Apply filters to expenses
  const applyFilters = () => {
    let filtered = [...expenses];
    
    // Apply date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(expense => {
        const expenseDate = moment(expense.Date);
        return expenseDate.isBetween(startDate, endDate, null, '[]');
      });
    }
    
    // Apply resource type filter
    if (filterValues.resourceTypes.length > 0) {
      filtered = filtered.filter(expense =>
        filterValues.resourceTypes.includes(expense.Resource_Type)
      );
    }
    
    // Apply category filter
    if (filterValues.categories.length > 0) {
      filtered = filtered.filter(expense =>
        filterValues.categories.includes(expense.Category)
      );
    }
    
    setFilteredExpenses(filtered);
  };

  // Handle download docx
  const handleDownloadDocx = async () => {
    try {
      setLoading(true);

      // Calculate total and summaries
      const total = filteredExpenses.reduce((sum, expense) => sum + (expense.Amount || 0), 0);
      
      // Group by resource type
      const resourceTypeSummary = {};
      filteredExpenses.forEach(expense => {
        const typeName = getResourceTypeDisplayName(expense.Resource_Type);
        if (!resourceTypeSummary[typeName]) {
          resourceTypeSummary[typeName] = 0;
        }
        resourceTypeSummary[typeName] += expense.Amount || 0;
      });

      // Group by category
      const categorySummary = {};
      filteredExpenses.forEach(expense => {
        const category = expense.Category || 'Без категории';
        if (!categorySummary[category]) {
          categorySummary[category] = 0;
        }
        categorySummary[category] += expense.Amount || 0;
      });

      // Create document
const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1000,
            right: 1000,
            bottom: 1000,
            left: 1000,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              text: "Отчёт о расходах",
              style: "headerStyle",
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun("Страница "),
                new TextRun({
                  children: [PageNumber.CURRENT],
                }),
                new TextRun(" из "),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                }),
              ],
              style: "footerStyle",
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          text: "Отчёт о расходах",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 200,
            after: 200,
          },
          style: "headingStyle",
        }),
        new Paragraph({
          text: `За период: ${dateRange[0].format('DD.MM.YYYY')} - ${dateRange[1].format('DD.MM.YYYY')}`,
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 100,
            after: 400,
          },
          style: "normalText",
        }),
        
        // Summary section
        ...(includeSummary ? [
          new Paragraph({
            text: "Сводная информация",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
            spacing: {
              before: 200,
              after: 200,
            },
            style: "headingStyle",
          }),
          new Paragraph({
            text: `Общая сумма расходов: ${formatCurrency(total)}`,
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              before: 100,
              after: 100,
            },
            style: "normalText",
          }),
          
          // Resource type summary
          new Paragraph({
            text: "Расходы по типам ресурсов:",
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              before: 200,
              after: 100,
            },
            style: "normalText",
          }),
          new DocxTable({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      text: "Тип ресурса",
                      alignment: AlignmentType.CENTER,
                      style: "tableHeader",
                    })],
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                    shading: {
                      fill: "F2F2F2",
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      text: "Сумма",
                      alignment: AlignmentType.CENTER,
                      style: "tableHeader",
                    })],
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                    shading: {
                      fill: "F2F2F2",
                    },
                  })
                ]
              }),
              ...Object.entries(resourceTypeSummary).map(([type, amount]) => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        text: type,
                        alignment: AlignmentType.LEFT,
                        style: "normalText",
                      })]
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        text: formatCurrency(amount),
                        alignment: AlignmentType.RIGHT,
                        style: "normalText",
                      })]
                    })
                  ]
                })
              )
            ],
            tableProperties: {
              tableWidth: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                insideHorizontal: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                insideVertical: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
              },
              layout: TableLayoutType.FIXED,
            },
          }),
          
          // Category summary
          new Paragraph({
            text: "Расходы по категориям:",
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              before: 200,
              after: 100,
            },
            style: "normalText",
          }),
          new DocxTable({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      text: "Категория",
                      alignment: AlignmentType.CENTER,
                      style: "tableHeader",
                    })],
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                    shading: {
                      fill: "F2F2F2",
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      text: "Сумма",
                      alignment: AlignmentType.CENTER,
                      style: "tableHeader",
                    })],
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                    shading: {
                      fill: "F2F2F2",
                    },
                  })
                ]
              }),
              ...Object.entries(categorySummary).map(([category, amount]) => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        text: category,
                        alignment: AlignmentType.LEFT,
                        style: "normalText",
                      })]
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        text: formatCurrency(amount),
                        alignment: AlignmentType.RIGHT,
                        style: "normalText",
                      })]
                    })
                  ]
                })
              )
            ],
            tableProperties: {
              tableWidth: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                insideHorizontal: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                insideVertical: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
              },
              layout: TableLayoutType.FIXED,
            },
          })
        ] : []),
        
        // Details section
        ...(includeDetails ? [
          new Paragraph({
            text: "Детализация расходов",
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
            spacing: {
              before: 400,
              after: 200,
            },
            style: "headingStyle",
          }),
          new DocxTable({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  ...(selectedColumns.includes('date') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Дата",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('resourceType') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Тип ресурса",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('resource') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Ресурс",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('category') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Категория",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('amount') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Сумма",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('description') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Описание",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('paymentMethod') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Способ оплаты",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('invoiceNumber') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Номер счета",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : [])
                ]
              }),
              ...filteredExpenses.map(expense => 
                new TableRow({
                  children: [
                    ...(selectedColumns.includes('date') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: moment(expense.Date).format('DD.MM.YYYY'),
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('resourceType') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: getResourceTypeDisplayName(expense.Resource_Type),
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('resource') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: getResourceName(expense.Resource_Type, expense.Resource_ID),
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('category') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: expense.Category || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('amount') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: formatCurrency(expense.Amount),
                          alignment: AlignmentType.RIGHT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('description') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: expense.Description || '',
                          alignment: AlignmentType.JUSTIFIED,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('paymentMethod') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: expense.Payment_Method || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('invoiceNumber') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: expense.Invoice_Number || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : [])
                  ]
                })
              )
            ],
            tableProperties: {
              tableWidth: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: {
                top: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                left: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                right: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                insideHorizontal: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                insideVertical: {
                  style: BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
              },
              layout: TableLayoutType.FIXED,
            },
          })
        ] : []),
        
        // Footer
        new Paragraph({
          text: `Дата формирования отчёта: ${moment().format('DD.MM.YYYY HH:mm')}`,
          alignment: AlignmentType.RIGHT,
          spacing: {
            before: 400,
            after: 0,
          },
          style: "normalText",
        })
      ]
    }
  ],
  styles: {
    paragraphStyles: [
      {
        id: "normalText",
        name: "Normal Text",
        run: {
          size: 24, // 12pt
          font: "Times New Roman",
        },
        paragraph: {
          spacing: {
            line: 276, // 1.15 line spacing
          },
        },
      },
      {
        id: "headingStyle",
        name: "Heading Style",
        run: {
          size: 28, // 14pt
          font: "Times New Roman",
          bold: true,
        },
        paragraph: {
          spacing: {
            line: 276, // 1.15 line spacing
          },
        },
      },
      {
        id: "tableHeader",
        name: "Table Header",
        run: {
          size: 24, // 12pt
          font: "Times New Roman",
          bold: true,
        },
      },
      {
        id: "headerStyle",
        name: "Header Style",
        run: {
          size: 20, // 10pt
          font: "Times New Roman",
          color: "808080",
        },
      },
      {
        id: "footerStyle",
        name: "Footer Style",
        run: {
          size: 18, // 9pt
          font: "Times New Roman",
          color: "808080",
        },
      },
    ],
  },
});

      // Generate and save document
      Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Отчёт_о_расходах_${moment().format('YYYY-MM-DD')}.docx`);
        message.success('Отчёт успешно сформирован!');
      });
    } catch (err) {
      message.error(`Ошибка при формировании отчёта: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle print preview
const handlePrintPreview = () => {
  try {
    // Показываем сообщение
    message.info('Открывается окно предварительного просмотра...');
    
    // Используем компонент предпросмотра
    const previewComponent = ExpenseDocxPreview({
      filteredExpenses,
      dateRange,
      includeSummary,
      includeDetails,
      selectedColumns,
      getResourceTypeDisplayName,
      getResourceName,
      formatCurrency
    });
    
    previewComponent.openPrintPreview();
  } catch (error) {
    message.error(`Ошибка при открытии предварительного просмотра: ${error.message}`);
  }
};

  // Handle form submission
  const handleFormSubmit = () => {
    handleDownloadDocx();
  };

  // Get resource type options
  const resourceTypeOptions = [
    { value: 'Employee', label: 'Сотрудник' },
    { value: 'Equipment', label: 'Оборудование' },
    { value: 'Transportation', label: 'Транспорт' },
    { value: 'Tool', label: 'Инструмент' },
    { value: 'Spare', label: 'Запчасть' },
    { value: 'Material', label: 'Материал' }
  ];

  // Column options for report
  const columnOptions = [
    { value: 'date', label: 'Дата' },
    { value: 'resourceType', label: 'Тип ресурса' },
    { value: 'resource', label: 'Ресурс' },
    { value: 'category', label: 'Категория' },
    { value: 'amount', label: 'Сумма' },
    { value: 'description', label: 'Описание' },
    { value: 'paymentMethod', label: 'Способ оплаты' },
    { value: 'invoiceNumber', label: 'Номер счета' }
  ];

  // Handle column selection change
  const handleColumnChange = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  // Total summary data
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + (expense.Amount || 0), 0);

  return (
    <div className="expense-docx-page">
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/expenses">
          Расходы
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Формирование отчёта
        </Breadcrumb.Item>
      </Breadcrumb>
      
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/expenses')}
          className="back-button"
        >
          Назад к списку
        </Button>
        <Title level={3} className="expense-docx-title">
          Формирование отчёта по расходам
        </Title>
      </div>
      
      <Spin spinning={initialLoading}>
        <Card className="expense-docx-main-card">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            className="expense-docx-tabs"
          >
            <TabPane 
              tab={
                <span>
                  <FilterOutlined />
                  Параметры отчёта
                </span>
              } 
              key="1"
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFormSubmit}
                className="expense-docx-form"
              >
                <Row gutter={[16, 16]}>
                  {/* Левая колонка с фильтрами */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title="Период и фильтры" 
                      className="filter-card"
                      bordered={false}
                    >
                      <Form.Item
                        label="Период отчёта"
                        required
                      >
                        <DateRangePicker
                          value={dateRange}
                          onChange={handleDateRangeChange}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                      
                      <Collapse 
                        ghost 
                        defaultActiveKey={[]} 
                        className="filter-collapse"
                      >
                        <Panel header="Дополнительные фильтры" key="1">
                          <Form.Item
                            name="resourceTypes"
                            label="Типы ресурсов"
                          >
                            <Select
                              mode="multiple"
                              placeholder="Все типы ресурсов"
                              allowClear
                              style={{ width: '100%' }}
                              value={filterValues.resourceTypes}
                              onChange={(values) => handleFilterChange('resourceTypes', values)}
                            >
                              {resourceTypeOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                  {option.label}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                          
                          <Form.Item
                            name="categories"
                            label="Категории"
                          >
                            <Select
                              mode="multiple"
                              placeholder="Все категории"
                              allowClear
                              style={{ width: '100%' }}
                              value={filterValues.categories}
                              onChange={(values) => handleFilterChange('categories', values)}
                            >
                              {categories.map(category => (
                                <Option key={category} value={category}>
                                  {category}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Panel>
                      </Collapse>
                    </Card>
                  </Col>
                  
                  {/* Правая колонка с настройками содержания */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title="Содержание отчёта" 
                      className="content-card"
                      bordered={false}
                    >
                      <div className="content-options">
                        <Form.Item>
                          <Checkbox
                            checked={includeSummary}
                            onChange={(e) => setIncludeSummary(e.target.checked)}
                          >
                            <b>Включить сводную информацию</b>
                          </Checkbox>
                        </Form.Item>
                        
                        <Form.Item>
                          <Checkbox
                            checked={includeDetails}
                            onChange={(e) => setIncludeDetails(e.target.checked)}
                          >
                            <b>Включить детализацию расходов</b>
                          </Checkbox>
                        </Form.Item>
                      </div>
                      
                      {includeDetails && (
                        <Collapse 
                          ghost 
                          defaultActiveKey={['1']} 
                          className="columns-collapse"
                        >
                          <Panel header="Выбор столбцов" key="1">
                            <Form.Item>
                              <Checkbox.Group
                                options={columnOptions}
                                value={selectedColumns}
                                onChange={handleColumnChange}
                                className="column-checkbox-group"
                              />
                            </Form.Item>
                          </Panel>
                        </Collapse>
                      )}
                    </Card>
                  </Col>
                </Row>
                
                {/* Информация о найденных данных */}
                <Card className="expense-summary-card" bordered={false}>
                  <div className="expense-summary">
                    <div className="expense-count">
                      <Text>Найдено записей: <b>{filteredExpenses.length}</b></Text>
                    </div>
                    <div className="expense-total">
                      <Text>Общая сумма: <b>{formatCurrency(totalAmount)}</b></Text>
                    </div>
                  </div>
                </Card>
              </Form>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <FileTextOutlined />
                  Предпросмотр
                </span>
              } 
              key="2"
            >
              <div className="preview-container">
                {filteredExpenses.length > 0 ? (
                  <>
                    {includeSummary && (
                      <Card 
                        title="Сводная информация" 
                        className="preview-summary-card"
                        bordered={false}
                      >
                        <p className="summary-total">Общая сумма расходов: <b>{formatCurrency(totalAmount)}</b></p>
                        
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <Card title="По типам ресурсов" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredExpenses.reduce((acc, expense) => {
                                  const typeName = getResourceTypeDisplayName(expense.Resource_Type);
                                  acc[typeName] = (acc[typeName] || 0) + (expense.Amount || 0);
                                  return acc;
                                }, {})).map(([type, amount]) => ({ type, amount }))}
                                columns={[
                                  { title: 'Тип ресурса', dataIndex: 'type', key: 'type' },
                                  { 
                                    title: 'Сумма', 
                                    dataIndex: 'amount',
                                    key: 'amount',
                                    render: amount => formatCurrency(amount)
                                  }
                                ]}
                                pagination={false}
                                size="small"
                              />
                            </Card>
                          </Col>
                          <Col xs={24} md={12}>
                            <Card title="По категориям" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredExpenses.reduce((acc, expense) => {
                                  const category = expense.Category || 'Без категории';
                                  acc[category] = (acc[category] || 0) + (expense.Amount || 0);
                                  return acc;
                                }, {})).map(([category, amount]) => ({ category, amount }))}
                                columns={[
                                  { title: 'Категория', dataIndex: 'category', key: 'category' },
                                  { 
                                    title: 'Сумма', 
                                    dataIndex: 'amount',
                                    key: 'amount',
                                    render: amount => formatCurrency(amount)
                                  }
                                ]}
                                pagination={false}
                                size="small"
                              />
                            </Card>
                          </Col>
                        </Row>
                      </Card>
                    )}
                    
                    {includeDetails && (
                      <Card 
                        title="Детализация расходов" 
                        className="preview-details-card"
                        bordered={false}
                      >
                        <Table
                          dataSource={filteredExpenses}
                          columns={[
                            ...(selectedColumns.includes('date') ? [{
                              title: 'Дата',
                              key: 'date',
                              render: record => moment(record.Date).format('DD.MM.YYYY')
                            }] : []),
                            ...(selectedColumns.includes('resourceType') ? [{
                              title: 'Тип ресурса',
                              key: 'resourceType',
                              render: record => getResourceTypeDisplayName(record.Resource_Type)
                            }] : []),
                            ...(selectedColumns.includes('resource') ? [{
                              title: 'Ресурс',
                              key: 'resource',
                              render: record => getResourceName(record.Resource_Type, record.Resource_ID)
                            }] : []),
                            ...(selectedColumns.includes('category') ? [{
                              title: 'Категория',
                              dataIndex: 'Category',
                              key: 'category'
                            }] : []),
                            ...(selectedColumns.includes('amount') ? [{
                              title: 'Сумма',
                              key: 'amount',
                              render: record => formatCurrency(record.Amount)
                            }] : []),
                            ...(selectedColumns.includes('description') ? [{
                              title: 'Описание',
                              dataIndex: 'Description',
                              key: 'description'
                            }] : []),
                            ...(selectedColumns.includes('paymentMethod') ? [{
                              title: 'Способ оплаты',
                              dataIndex: 'Payment_Method',
                              key: 'paymentMethod'
                            }] : []),
                            ...(selectedColumns.includes('invoiceNumber') ? [{
                              title: 'Номер счета',
                              dataIndex: 'Invoice_Number',
                              key: 'invoiceNumber'
                            }] : [])
                          ]}
                          rowKey="Expense_ID"
                          pagination={{ pageSize: 10 }}
                          size="small"
                          locale={{ emptyText: 'Нет данных для отображения' }}
                          scroll={{ x: 'max-content' }}
                        />
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="no-data-message">
                    <Text>Нет данных для отображения. Пожалуйста, измените параметры фильтрации.</Text>
                  </div>
                )}
              </div>
            </TabPane>
          </Tabs>
          
          <div className="docx-actions">
            <Space size="middle">
              <Button
                type="primary"
                onClick={handleDownloadDocx}
                loading={loading}
                icon={<FileWordOutlined />}
                size="large"
                disabled={filteredExpenses.length === 0 || (!includeSummary && !includeDetails)}
              >
                Скачать .docx
              </Button>
              <Button 
                onClick={handlePrintPreview}
                icon={<PrinterOutlined />}
                size="large"
                disabled={filteredExpenses.length === 0 || (!includeSummary && !includeDetails)}
              >
                Предпросмотр для печати
              </Button>
            </Space>
          </div>
        </Card>
      </Spin>
    </div>
  );
};

export default ExpenseDocx;