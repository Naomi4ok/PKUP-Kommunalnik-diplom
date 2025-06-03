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
import '../../styles/Spares/SparesDocx.css';

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

const SparesDocx = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [spares, setSpares] = useState([]);
  const [filteredSpares, setFilteredSpares] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [statuses, setStatuses] = useState(['В наличии', 'Заканчивается', 'Нет в наличии', 'Заказано']);
  const [dateRange, setDateRange] = useState([moment().startOf('month'), moment()]);
  const [selectedColumns, setSelectedColumns] = useState([
    'name', 'quantity', 'unitCost', 'totalCost', 'location', 'supplier', 'status'
  ]);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [filterValues, setFilterValues] = useState({
    statuses: [],
    suppliers: [],
    locations: []
  });
  const [activeTab, setActiveTab] = useState('1');

  // Fetch all required data on component mount
  useEffect(() => {
    Promise.all([
      fetchSpares()
    ]).then(() => {
      setInitialLoading(false);
    }).catch(error => {
      message.error(`Ошибка при загрузке данных: ${error.message}`);
      setInitialLoading(false);
    });
  }, []);

  // Update filtered spares when spares change or filters change
  useEffect(() => {
    applyFilters();
  }, [spares, dateRange, filterValues]);

  // Extract unique values for filters
  useEffect(() => {
    if (spares.length > 0) {
      const uniqueLocations = Array.from(
        new Set(spares.map(s => s.Location).filter(Boolean))
      );
      setLocations(uniqueLocations);
      
      const uniqueSuppliers = Array.from(
        new Set(spares.map(s => s.Supplier).filter(Boolean))
      );
      setSuppliers(uniqueSuppliers);
    }
  }, [spares]);

  // Fetch spares
  const fetchSpares = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spares');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setSpares(data);
      return data;
    } catch (err) {
      message.error(`Не удалось загрузить данные о запчастях: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
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

  // Format date to DD.MM.YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return moment(date).format('DD.MM.YYYY');
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

  // Apply filters to spares
  const applyFilters = () => {
    let filtered = [...spares];
    
    // Apply date range filter (for last replenishment date)
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(spare => {
        if (!spare.Last_Replenishment_Date) return false;
        const spareDate = moment(spare.Last_Replenishment_Date);
        return spareDate.isBetween(startDate, endDate, null, '[]');
      });
    }
    
    // Apply status filter
    if (filterValues.statuses.length > 0) {
      filtered = filtered.filter(spare =>
        filterValues.statuses.includes(spare.Status)
      );
    }
    
    // Apply supplier filter
    if (filterValues.suppliers.length > 0) {
      filtered = filtered.filter(spare =>
        filterValues.suppliers.includes(spare.Supplier)
      );
    }
    
    // Apply location filter
    if (filterValues.locations.length > 0) {
      filtered = filtered.filter(spare =>
        filterValues.locations.includes(spare.Location)
      );
    }
    
    setFilteredSpares(filtered);
  };

  // Handle download docx
  const handleDownloadDocx = async () => {
    try {
      setLoading(true);

      // Calculate total and summaries
      const totalQuantity = filteredSpares.reduce((sum, spare) => sum + (spare.Quantity || 0), 0);
      const totalCost = filteredSpares.reduce((sum, spare) => sum + (spare.Total_Cost || 0), 0);
      
      // Group by status
      const statusSummary = {};
      filteredSpares.forEach(spare => {
        const status = spare.Status || 'Не указан';
        if (!statusSummary[status]) {
          statusSummary[status] = { quantity: 0, cost: 0 };
        }
        statusSummary[status].quantity += spare.Quantity || 0;
        statusSummary[status].cost += spare.Total_Cost || 0;
      });

      // Group by supplier
      const supplierSummary = {};
      filteredSpares.forEach(spare => {
        const supplier = spare.Supplier || 'Не указан';
        if (!supplierSummary[supplier]) {
          supplierSummary[supplier] = { quantity: 0, cost: 0 };
        }
        supplierSummary[supplier].quantity += spare.Quantity || 0;
        supplierSummary[supplier].cost += spare.Total_Cost || 0;
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
                text: "Отчёт по запчастям",
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
                  text: `Общее количество запчастей: ${totalQuantity}`,
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: {
                    before: 100,
                    after: 100,
                  },
                  style: "normalText",
                }),
                new Paragraph({
                  text: `Общая стоимость: ${formatCurrency(totalCost)}`,
                  alignment: AlignmentType.JUSTIFIED,
                  spacing: {
                    before: 100,
                    after: 100,
                  },
                  style: "normalText",
                }),
                
                // Status summary
                new Paragraph({
                  text: "Запчасти по статусу:",
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
                            text: "Статус",
                            alignment: AlignmentType.CENTER,
                            style: "tableHeader",
                          })],
                          width: {
                            size: 40,
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
                        }),
                        new TableCell({
                          children: [new Paragraph({
                            text: "Стоимость",
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
                    ...Object.entries(statusSummary).map(([status, data]) => 
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({
                              text: status,
                              alignment: AlignmentType.LEFT,
                              style: "normalText",
                            })]
                          }),
                          new TableCell({
                            children: [new Paragraph({
                              text: data.quantity.toString(),
                              alignment: AlignmentType.RIGHT,
                              style: "normalText",
                            })]
                          }),
                          new TableCell({
                            children: [new Paragraph({
                              text: formatCurrency(data.cost),
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
                
                // Supplier summary
                new Paragraph({
                  text: "Запчасти по поставщикам:",
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
                            text: "Поставщик",
                            alignment: AlignmentType.CENTER,
                            style: "tableHeader",
                          })],
                          width: {
                            size: 40,
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
                        }),
                        new TableCell({
                          children: [new Paragraph({
                            text: "Стоимость",
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
                    ...Object.entries(supplierSummary).map(([supplier, data]) => 
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({
                              text: supplier,
                              alignment: AlignmentType.LEFT,
                              style: "normalText",
                            })]
                          }),
                          new TableCell({
                            children: [new Paragraph({
                              text: data.quantity.toString(),
                              alignment: AlignmentType.RIGHT,
                              style: "normalText",
                            })]
                          }),
                          new TableCell({
                            children: [new Paragraph({
                              text: formatCurrency(data.cost),
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
                  text: "Детализация запчастей",
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
                        ...(selectedColumns.includes('quantity') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Количество",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: {
                              fill: "F2F2F2",
                            },
                          })
                        ] : []),
                        ...(selectedColumns.includes('unitCost') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Цена за ед.",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: {
                              fill: "F2F2F2",
                            },
                          })
                        ] : []),
                        ...(selectedColumns.includes('totalCost') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Общая стоимость",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: {
                              fill: "F2F2F2",
                            },
                          })
                        ] : []),
                        ...(selectedColumns.includes('lastReplenishmentDate') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Дата пополнения",
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
                              text: "Место хранения",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: {
                              fill: "F2F2F2",
                            },
                          })
                        ] : []),
                        ...(selectedColumns.includes('supplier') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Поставщик",
                              alignment: AlignmentType.CENTER,
                              style: "tableHeader",
                            })],
                            shading: {
                              fill: "F2F2F2",
                            },
                          })
                        ] : []),
                        ...(selectedColumns.includes('status') ? [
                          new TableCell({
                            children: [new Paragraph({
                              text: "Статус",
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
                    ...filteredSpares.map(spare => 
                      new TableRow({
                        children: [
                          ...(selectedColumns.includes('name') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: spare.Name || '',
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('quantity') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: (spare.Quantity || 0).toString(),
                                alignment: AlignmentType.RIGHT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('unitCost') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: formatCurrency(spare.Unit_Cost),
                                alignment: AlignmentType.RIGHT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('totalCost') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: formatCurrency(spare.Total_Cost),
                                alignment: AlignmentType.RIGHT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('lastReplenishmentDate') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: formatDate(spare.Last_Replenishment_Date),
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('location') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: spare.Location || '',
                                alignment: AlignmentType.LEFT,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('supplier') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: spare.Supplier || '',
                                alignment: AlignmentType.Left,
                                style: "normalText",
                              })]
                            })
                          ] : []),
                          ...(selectedColumns.includes('status') ? [
                            new TableCell({
                              children: [new Paragraph({
                                text: spare.Status || '',
                                alignment: AlignmentType.Left,
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
        saveAs(blob, `Отчёт_по_запчастям_${moment().format('YYYY-MM-DD')}.docx`);
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

  // Column options for report
  const columnOptions = [
    { value: 'name', label: 'Наименование' },
    { value: 'quantity', label: 'Количество' },
    { value: 'unitCost', label: 'Цена за единицу' },
    { value: 'totalCost', label: 'Общая стоимость' },
    { value: 'lastReplenishmentDate', label: 'Дата пополнения' },
    { value: 'location', label: 'Место хранения' },
    { value: 'supplier', label: 'Поставщик' },
    { value: 'status', label: 'Статус' }
  ];

  // Handle column selection change
  const handleColumnChange = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  // Total summary data
  const totalQuantity = filteredSpares.reduce((sum, spare) => sum + (spare.Quantity || 0), 0);
  const totalCost = filteredSpares.reduce((sum, spare) => sum + (spare.Total_Cost || 0), 0);

  return (
    <div className="spares-docx-page">
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/spares">
          Запчасти
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Формирование отчёта
        </Breadcrumb.Item>
      </Breadcrumb>
      
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/spares')}
          className="back-button"
        >
          Назад к списку запчастей
        </Button>
        <Title level={3} className="spares-docx-title">
          Формирование отчёта по запчастям
        </Title>
        <Button
          className="ant-add-button"
          type="primary"
          onClick={handleDownloadDocx}
          loading={loading}
          icon={<FileWordOutlined />}
          disabled={filteredSpares.length === 0 || (!includeSummary && !includeDetails)}
        >
          Скачать .docx
        </Button>
      </div>
      
      <Spin spinning={initialLoading}>
        <Card className="spares-docx-main-card">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            className="spares-docx-tabs"
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
                className="spares-docx-form"
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
                        label="Период отчёта (по дате пополнения)"
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
                          name="statuses"
                          label="Дополнительные фильтры: Статус"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все статусы"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.statuses}
                            onChange={(values) => handleFilterChange('statuses', values)}
                          >
                            {statuses.map(status => (
                              <Option key={status} value={status}>
                                {status}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        
                        <Form.Item
                          name="suppliers"
                          label="Поставщики"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все поставщики"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.suppliers}
                            onChange={(values) => handleFilterChange('suppliers', values)}
                          >
                            {suppliers.map(supplier => (
                              <Option key={supplier} value={supplier}>
                                {supplier}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        
                        <Form.Item
                          name="locations"
                          label="Места хранения"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все места хранения"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.locations}
                            onChange={(values) => handleFilterChange('locations', values)}
                          >
                            {locations.map(location => (
                              <Option key={location} value={location}>
                                {location}
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
                            <b>Включить детализацию запчастей</b>
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
                <Card className="spares-summary-card" bordered={false}>
                  <div className="spares-summary">
                    <div className="spares-count">
                      <Text>Найдено записей: <b>{filteredSpares.length}</b></Text>
                    </div>
                    <div className="spares-quantity">
                      <Text>Общее количество: <b>{totalQuantity}</b></Text>
                    </div>
                    <div className="spares-total">
                      <Text>Общая стоимость: <b>{formatCurrency(totalCost)}</b></Text>
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
                {filteredSpares.length > 0 ? (
                  <>
                    {includeSummary && (
                      <Card 
                        title="Сводная информация" 
                        className="preview-summary-card"
                        bordered={false}
                      >
                        <p className="summary-total">
                          Общее количество запчастей: <b>{totalQuantity}</b><br/>
                          Общая стоимость: <b>{formatCurrency(totalCost)}</b>
                        </p>
                        
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <Card title="По статусу" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredSpares.reduce((acc, spare) => {
                                  const status = spare.Status || 'Не указан';
                                  if (!acc[status]) acc[status] = { quantity: 0, cost: 0 };
                                  acc[status].quantity += spare.Quantity || 0;
                                  acc[status].cost += spare.Total_Cost || 0;
                                  return acc;
                                }, {})).map(([status, data]) => ({ status, ...data }))}
                                columns={[
                                  { title: 'Статус', dataIndex: 'status', key: 'status' },
                                  { title: 'Количество', dataIndex: 'quantity', key: 'quantity' },
                                  { 
                                    title: 'Стоимость', 
                                    dataIndex: 'cost',
                                    key: 'cost',
                                    render: cost => formatCurrency(cost)
                                  }
                                ]}
                                pagination={false}
                                size="small"
                              />
                            </Card>
                          </Col>
                          <Col xs={24} md={12}>
                            <Card title="По поставщикам" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredSpares.reduce((acc, spare) => {
                                  const supplier = spare.Supplier || 'Не указан';
                                  if (!acc[supplier]) acc[supplier] = { quantity: 0, cost: 0 };
                                  acc[supplier].quantity += spare.Quantity || 0;
                                  acc[supplier].cost += spare.Total_Cost || 0;
                                  return acc;
                                }, {})).map(([supplier, data]) => ({ supplier, ...data }))}
                                columns={[
                                  { title: 'Поставщик', dataIndex: 'supplier', key: 'supplier' },
                                  { title: 'Количество', dataIndex: 'quantity', key: 'quantity' },
                                  { 
                                    title: 'Стоимость', 
                                    dataIndex: 'cost',
                                    key: 'cost',
                                    render: cost => formatCurrency(cost)
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
                        title="Детализация запчастей" 
                        className="preview-details-card"
                        bordered={false}
                      >
                        <Table
                          dataSource={filteredSpares}
                          columns={[
                            ...(selectedColumns.includes('name') ? [{
                              title: 'Наименование',
                              dataIndex: 'Name',
                              key: 'name'
                            }] : []),
                            ...(selectedColumns.includes('quantity') ? [{
                              title: 'Количество',
                              dataIndex: 'Quantity',
                              key: 'quantity'
                            }] : []),
                            ...(selectedColumns.includes('unitCost') ? [{
                              title: 'Цена за ед.',
                              key: 'unitCost',
                              render: record => formatCurrency(record.Unit_Cost)
                            }] : []),
                            ...(selectedColumns.includes('totalCost') ? [{
                              title: 'Общая стоимость',
                              key: 'totalCost',
                              render: record => formatCurrency(record.Total_Cost)
                            }] : []),
                            ...(selectedColumns.includes('lastReplenishmentDate') ? [{
                              title: 'Дата пополнения',
                              key: 'lastReplenishmentDate',
                              render: record => formatDate(record.Last_Replenishment_Date)
                            }] : []),
                            ...(selectedColumns.includes('location') ? [{
                              title: 'Место хранения',
                              dataIndex: 'Location',
                              key: 'location'
                            }] : []),
                            ...(selectedColumns.includes('supplier') ? [{
                              title: 'Поставщик',
                              dataIndex: 'Supplier',
                              key: 'supplier'
                            }] : []),
                            ...(selectedColumns.includes('status') ? [{
                              title: 'Статус',
                              dataIndex: 'Status',
                              key: 'status'
                            }] : [])
                          ]}
                          rowKey="Spare_ID"
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

export default SparesDocx;