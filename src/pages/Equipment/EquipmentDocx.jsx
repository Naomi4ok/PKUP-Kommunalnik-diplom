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
  SettingOutlined,
  FileTextOutlined,
  TableOutlined,
  FilterOutlined
} from '@ant-design/icons';
import moment from 'moment';
import DateRangePicker from '../../components/DateRangePicker/DateRangePicker';
import '../../styles/Equipment/EquipmentDocx.css';

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

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const EquipmentDocx = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dateRange, setDateRange] = useState([moment().subtract(1, 'year'), moment()]);
  const [selectedColumns, setSelectedColumns] = useState([
    'name', 'type', 'manufacturer', 'model', 'condition', 'location'
  ]);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [filterValues, setFilterValues] = useState({
    types: [],
    manufacturers: [],
    conditions: [],
    locations: []
  });
  const [activeTab, setActiveTab] = useState('1');

  // Fetch all required data on component mount
  useEffect(() => {
    Promise.all([
      fetchEquipment(),
      fetchEmployees()
    ]).then(() => {
      setInitialLoading(false);
    }).catch(error => {
      message.error(`Ошибка при загрузке данных: ${error.message}`);
      setInitialLoading(false);
    });
  }, []);

  // Update filtered equipment when equipment changes or filters change
  useEffect(() => {
    applyFilters();
  }, [equipment, dateRange, filterValues]);

  // Fetch equipment
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/equipment');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setEquipment(data);
      return data;
    } catch (err) {
      message.error(`Не удалось загрузить данные об оборудовании: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setEmployees(data);
      return data;
    } catch (err) {
      message.error(`Не удалось загрузить данные о сотрудниках: ${err.message}`);
      return [];
    }
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId) => {
    if (!employeeId) return 'Не назначен';
    const employee = employees.find(emp => emp.Employee_ID === employeeId);
    return employee ? employee.Full_Name : `ID: ${employeeId}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    return moment(dateString).format('DD.MM.YYYY');
  };

  // Get condition display name with color
  const getConditionDisplayName = (condition) => {
    const conditionMap = {
      'Рабочее': 'Рабочее',
      'Требует ТО': 'Требует ТО',
      'Неисправно': 'Неисправно',
      'Ремонтируется': 'Ремонтируется'
    };
    return conditionMap[condition] || condition || 'Не указано';
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

  // Apply filters to equipment
  const applyFilters = () => {
    let filtered = [...equipment];
    
    // Apply date range filter (for commission date)
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(item => {
        if (!item.Commission_Date) return true; // Include items without commission date
        const commissionDate = moment(item.Commission_Date);
        return commissionDate.isBetween(startDate, endDate, null, '[]');
      });
    }
    
    // Apply type filter
    if (filterValues.types.length > 0) {
      filtered = filtered.filter(item =>
        filterValues.types.includes(item.Type)
      );
    }
    
    // Apply manufacturer filter
    if (filterValues.manufacturers.length > 0) {
      filtered = filtered.filter(item =>
        filterValues.manufacturers.includes(item.Manufacturer)
      );
    }
    
    // Apply condition filter
    if (filterValues.conditions.length > 0) {
      filtered = filtered.filter(item =>
        filterValues.conditions.includes(item.Condition)
      );
    }
    
    // Apply location filter
    if (filterValues.locations.length > 0) {
      filtered = filtered.filter(item =>
        filterValues.locations.includes(item.Location)
      );
    }
    
    setFilteredEquipment(filtered);
  };

  // Handle download docx
  const handleDownloadDocx = async () => {
    try {
      setLoading(true);

      // Calculate summaries
      const totalCount = filteredEquipment.length;
      
      // Group by type
      const typeSummary = {};
      filteredEquipment.forEach(item => {
        const type = item.Type || 'Не указан';
        if (!typeSummary[type]) {
          typeSummary[type] = 0;
        }
        typeSummary[type]++;
      });

      // Group by condition
      const conditionSummary = {};
      filteredEquipment.forEach(item => {
        const condition = getConditionDisplayName(item.Condition);
        if (!conditionSummary[condition]) {
          conditionSummary[condition] = 0;
        }
        conditionSummary[condition]++;
      });

      // Group by manufacturer
      const manufacturerSummary = {};
      filteredEquipment.forEach(item => {
        const manufacturer = item.Manufacturer || 'Не указан';
        if (!manufacturerSummary[manufacturer]) {
          manufacturerSummary[manufacturer] = 0;
        }
        manufacturerSummary[manufacturer]++;
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
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                }),
              ],
              style: "footerStyle",
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          text: "Отчёт по оборудованию",
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
            text: `Общее количество единиц оборудования: ${totalCount}`,
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              before: 100,
              after: 100,
            },
            style: "normalText",
          }),
          
          // Type summary
          new Paragraph({
            text: "Распределение по типам:",
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
                      text: "Тип оборудования",
                      alignment: AlignmentType.CENTER,
                      style: "tableHeader",
                    })],
                    width: {
                      size: 70,
                      type: WidthType.PERCENTAGE,
                    },
                    shading: {
                      fill: "F2F2F2",
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      text: "Количество",
                      alignment: AlignmentType.CENTER,
                      style: "tableHeader",
                    })],
                    width: {
                      size: 30,
                      type: WidthType.PERCENTAGE,
                    },
                    shading: {
                      fill: "F2F2F2",
                    },
                  })
                ]
              }),
              ...Object.entries(typeSummary).map(([type, count]) => 
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
                        text: count.toString(),
                        alignment: AlignmentType.CENTER,
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
          
          // Condition summary
          new Paragraph({
            text: "Распределение по техническому состоянию:",
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
                      text: "Техническое состояние",
                      alignment: AlignmentType.CENTER,
                      style: "tableHeader",
                    })],
                    width: {
                      size: 70,
                      type: WidthType.PERCENTAGE,
                    },
                    shading: {
                      fill: "F2F2F2",
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      text: "Количество",
                      alignment: AlignmentType.CENTER,
                      style: "tableHeader",
                    })],
                    width: {
                      size: 30,
                      type: WidthType.PERCENTAGE,
                    },
                    shading: {
                      fill: "F2F2F2",
                    },
                  })
                ]
              }),
              ...Object.entries(conditionSummary).map(([condition, count]) => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        text: condition,
                        alignment: AlignmentType.LEFT,
                        style: "normalText",
                      })]
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        text: count.toString(),
                        alignment: AlignmentType.CENTER,
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
            text: "Детализация оборудования",
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
                  ...(selectedColumns.includes('name') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Наименование",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('type') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Тип",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('manufacturer') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Производитель",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('model') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Модель",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('inventoryNumber') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Инв. номер",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('commissionDate') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Дата ввода",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('responsible') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Ответственный",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('condition') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Состояние",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('location') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Местоположение",
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
              ...filteredEquipment.map(item => 
                new TableRow({
                  children: [
                    ...(selectedColumns.includes('name') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: item.Name || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('type') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: item.Type || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('manufacturer') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: item.Manufacturer || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('model') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: item.Model || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('inventoryNumber') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: item.Inventory_Number || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('commissionDate') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: formatDate(item.Commission_Date),
                          alignment: AlignmentType.CENTER,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('responsible') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: getEmployeeName(item.Responsible_Employee_ID),
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('condition') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: getConditionDisplayName(item.Condition),
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('location') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: item.Location || '',
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
        saveAs(blob, `Отчёт_по_оборудованию_${moment().format('YYYY-MM-DD')}.docx`);
        message.success('Отчёт успешно сформирован!');
      });
    } catch (err) {
      message.error(`Ошибка при формировании отчёта: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = () => {
    handleDownloadDocx();
  };

  // Get unique values for filters
  const getUniqueTypes = () => {
    const types = [...new Set(equipment.map(item => item.Type).filter(Boolean))];
    return types.map(type => ({ value: type, label: type }));
  };

  const getUniqueManufacturers = () => {
    const manufacturers = [...new Set(equipment.map(item => item.Manufacturer).filter(Boolean))];
    return manufacturers.map(manufacturer => ({ value: manufacturer, label: manufacturer }));
  };

  const getUniqueConditions = () => {
    const conditions = ['Рабочее', 'Требует ТО', 'Неисправно', 'Ремонтируется'];
    return conditions.map(condition => ({ value: condition, label: condition }));
  };

  const getUniqueLocations = () => {
    const locations = [...new Set(equipment.map(item => item.Location).filter(Boolean))];
    return locations.map(location => ({ value: location, label: location }));
  };

  // Column options for report
  const columnOptions = [
    { value: 'name', label: 'Наименование' },
    { value: 'type', label: 'Тип' },
    { value: 'manufacturer', label: 'Производитель' },
    { value: 'model', label: 'Модель' },
    { value: 'inventoryNumber', label: 'Инвентарный номер' },
    { value: 'commissionDate', label: 'Дата ввода в эксплуатацию' },
    { value: 'responsible', label: 'Ответственный' },
    { value: 'condition', label: 'Техническое состояние' },
    { value: 'location', label: 'Местоположение' }
  ];

  // Handle column selection change
  const handleColumnChange = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  return (
    <div className="equipment-docx-page">
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/equipment">
          Оборудование
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Формирование отчёта
        </Breadcrumb.Item>
      </Breadcrumb>
      
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/equipment')}
          className="back-button"
        >
          Назад к списку оборудования
        </Button>
        <Title level={3} className="equipment-docx-title">
          Формирование отчёта по оборудованию
        </Title>
        <Button
          className="ant-add-button"
          type="primary"
          onClick={handleDownloadDocx}
          loading={loading}
          icon={<FileWordOutlined />}
          disabled={filteredEquipment.length === 0 || (!includeSummary && !includeDetails)}
        >
          Скачать .docx
        </Button>
      </div>
      
      <Spin spinning={initialLoading}>
        <Card className="equipment-docx-main-card">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            className="equipment-docx-tabs"
          >
            <TabPane 
              tab={
                <span>
                  Параметры отчёта
                </span>
              } 
              key="1"
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFormSubmit}
                className="equipment-docx-form"
              >
                <Row gutter={[16, 16]}>
                  {/* Левая колонка с фильтрами */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title="Период и фильтры" 
                      className="docx-filter-card"
                      bordered={false}
                    >
                      <Form.Item
                        label="Период отчёта (по дате ввода в эксплуатацию)"
                        required
                      >
                        <DateRangePicker
                          value={dateRange}
                          onChange={handleDateRangeChange}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                      
                      <div className="additional-filters">
                        <Form.Item
                          name="types"
                          label="Дополнительные фильтры: Типы оборудования"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все типы"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.types}
                            onChange={(values) => handleFilterChange('types', values)}
                          >
                            {getUniqueTypes().map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        
                        <Form.Item
                          name="manufacturers"
                          label="Производители"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все производители"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.manufacturers}
                            onChange={(values) => handleFilterChange('manufacturers', values)}
                          >
                            {getUniqueManufacturers().map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item
                          name="conditions"
                          label="Техническое состояние"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все состояния"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.conditions}
                            onChange={(values) => handleFilterChange('conditions', values)}
                          >
                            {getUniqueConditions().map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item
                          name="locations"
                          label="Местоположение"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все местоположения"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.locations}
                            onChange={(values) => handleFilterChange('locations', values)}
                          >
                            {getUniqueLocations().map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </div>
                    </Card>
                  </Col>
                  
                  {/* Правая колонка с настройками содержания */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title="Содержание отчёта" 
                      className="docx-content-card"
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
                            <b>Включить детализацию оборудования</b>
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
                <Card className="equipment-summary-card" bordered={false}>
                  <div className="equipment-summary">
                    <div className="equipment-count">
                      <Text>Найдено единиц оборудования: <b>{filteredEquipment.length}</b></Text>
                    </div>
                  </div>
                </Card>
              </Form>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  Предпросмотр
                </span>
              } 
              key="2"
            >
              <div className="preview-container">
                {filteredEquipment.length > 0 ? (
                  <>
                    {includeSummary && (
                      <Card 
                        title="Сводная информация" 
                        className="preview-summary-card"
                        bordered={false}
                      >
                        <p className="summary-total">Общее количество единиц оборудования: <b>{filteredEquipment.length}</b></p>
                        
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <Card title="По типам" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredEquipment.reduce((acc, item) => {
                                  const type = item.Type || 'Не указан';
                                  acc[type] = (acc[type] || 0) + 1;
                                  return acc;
                                }, {})).map(([type, count]) => ({ type, count }))}
                                columns={[
                                  { title: 'Тип', dataIndex: 'type', key: 'type' },
                                  { 
                                    title: 'Количество', 
                                    dataIndex: 'count',
                                    key: 'count'
                                  }
                                ]}
                                pagination={false}
                                size="small"
                              />
                            </Card>
                          </Col>
                          <Col xs={24} md={12}>
                            <Card title="По техническому состоянию" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredEquipment.reduce((acc, item) => {
                                  const condition = getConditionDisplayName(item.Condition);
                                  acc[condition] = (acc[condition] || 0) + 1;
                                  return acc;
                                }, {})).map(([condition, count]) => ({ condition, count }))}
                                columns={[
                                  { title: 'Состояние', dataIndex: 'condition', key: 'condition' },
                                  { 
                                    title: 'Количество', 
                                    dataIndex: 'count',
                                    key: 'count'
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
                        title="Детализация оборудования" 
                        className="preview-details-card"
                        bordered={false}
                      >
                        <Table
                          dataSource={filteredEquipment}
                          columns={[
                            ...(selectedColumns.includes('name') ? [{
                              title: 'Наименование',
                              dataIndex: 'Name',
                              key: 'name'
                            }] : []),
                            ...(selectedColumns.includes('type') ? [{
                              title: 'Тип',
                              dataIndex: 'Type',
                              key: 'type'
                            }] : []),
                            ...(selectedColumns.includes('manufacturer') ? [{
                              title: 'Производитель',
                              dataIndex: 'Manufacturer',
                              key: 'manufacturer'
                            }] : []),
                            ...(selectedColumns.includes('model') ? [{
                              title: 'Модель',
                              dataIndex: 'Model',
                              key: 'model'
                            }] : []),
                            ...(selectedColumns.includes('inventoryNumber') ? [{
                              title: 'Инв. номер',
                              dataIndex: 'Inventory_Number',
                              key: 'inventoryNumber'
                            }] : []),
                            ...(selectedColumns.includes('commissionDate') ? [{
                              title: 'Дата ввода',
                              key: 'commissionDate',
                              render: record => formatDate(record.Commission_Date)
                            }] : []),
                            ...(selectedColumns.includes('responsible') ? [{
                              title: 'Ответственный',
                              key: 'responsible',
                              render: record => getEmployeeName(record.Responsible_Employee_ID)
                            }] : []),
                            ...(selectedColumns.includes('condition') ? [{
                              title: 'Состояние',
                              key: 'condition',
                              render: record => getConditionDisplayName(record.Condition)
                            }] : []),
                            ...(selectedColumns.includes('location') ? [{
                              title: 'Местоположение',
                              dataIndex: 'Location',
                              key: 'location'
                            }] : [])
                          ]}
                          rowKey="Equipment_ID"
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
        </Card>
      </Spin>
    </div>
  );
};

export default EquipmentDocx;