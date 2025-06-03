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
import '../../styles/Transport/TransportDocx.css';

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

const TransportDocx = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [transportList, setTransportList] = useState([]);
  const [filteredTransport, setFilteredTransport] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([
    'brand', 'model', 'year', 'licenseNumber', 'purpose'
  ]);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [filterValues, setFilterValues] = useState({
    purposes: [],
    conditions: [],
    brands: [],
    assignedEmployees: []
  });
  const [activeTab, setActiveTab] = useState('1');

  // Fetch all required data on component mount
  useEffect(() => {
    Promise.all([
      fetchTransport(),
      fetchEmployees()
    ]).then(() => {
      setInitialLoading(false);
    }).catch(error => {
      message.error(`Ошибка при загрузке данных: ${error.message}`);
      setInitialLoading(false);
    });
  }, []);

  // Update filtered transport when transport list changes or filters change
  useEffect(() => {
    applyFilters();
  }, [transportList, filterValues]);

  // Fetch transport data
  const fetchTransport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transportation');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      const formattedData = data.map(item => ({
        ...item,
        assignedEmployee: item.AssignedEmployeeName || 'Не назначен'
      }));
      setTransportList(formattedData);
      return formattedData;
    } catch (err) {
      message.error(`Не удалось загрузить данные о транспорте: ${err.message}`);
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

  // Get unique values for filters
  const getUniquePurposes = () => {
    const purposes = [...new Set(transportList.map(item => item.Purpose))];
    return purposes.filter(purpose => purpose);
  };

  const getUniqueConditions = () => {
    const conditions = [...new Set(transportList.map(item => item.TechnicalCondition))];
    return conditions.filter(condition => condition);
  };

  const getUniqueBrands = () => {
    const brands = [...new Set(transportList.map(item => item.Brand))];
    return brands.filter(brand => brand);
  };

  const getUniqueAssignedEmployees = () => {
    const assignedEmployees = [...new Set(transportList.map(item => item.assignedEmployee))];
    return assignedEmployees.filter(employee => employee && employee !== 'Не назначен');
  };

  // Handle filter changes
  const handleFilterChange = (filterType, values) => {
    setFilterValues(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  // Apply filters to transport
  const applyFilters = () => {
    let filtered = [...transportList];
    
    // Apply purpose filter
    if (filterValues.purposes.length > 0) {
      filtered = filtered.filter(transport =>
        filterValues.purposes.includes(transport.Purpose)
      );
    }
    
    // Apply condition filter
    if (filterValues.conditions.length > 0) {
      filtered = filtered.filter(transport =>
        filterValues.conditions.includes(transport.TechnicalCondition)
      );
    }

    // Apply brand filter
    if (filterValues.brands.length > 0) {
      filtered = filtered.filter(transport =>
        filterValues.brands.includes(transport.Brand)
      );
    }

    // Apply assigned employee filter
    if (filterValues.assignedEmployees.length > 0) {
      filtered = filtered.filter(transport =>
        filterValues.assignedEmployees.includes(transport.assignedEmployee)
      );
    }
    
    setFilteredTransport(filtered);
  };

  // Handle download docx
  const handleDownloadDocx = async () => {
    try {
      setLoading(true);

      // Calculate summaries
      const totalCount = filteredTransport.length;
      
      // Group by purpose
      const purposeSummary = {};
      filteredTransport.forEach(transport => {
        const purpose = transport.Purpose || 'Не указано';
        if (!purposeSummary[purpose]) {
          purposeSummary[purpose] = 0;
        }
        purposeSummary[purpose] += 1;
      });

      // Group by technical condition
      const conditionSummary = {};
      filteredTransport.forEach(transport => {
        const condition = transport.TechnicalCondition || 'Не указано';
        if (!conditionSummary[condition]) {
          conditionSummary[condition] = 0;
        }
        conditionSummary[condition] += 1;
      });

      // Group by brand
      const brandSummary = {};
      filteredTransport.forEach(transport => {
        const brand = transport.Brand || 'Не указано';
        if (!brandSummary[brand]) {
          brandSummary[brand] = 0;
        }
        brandSummary[brand] += 1;
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
          text: "Отчёт о транспортных средствах",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 200,
            after: 200,
          },
          style: "headingStyle",
        }),
        new Paragraph({
          text: `Дата формирования: ${moment().format('DD.MM.YYYY')}`,
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
            text: `Общее количество транспортных средств: ${totalCount}`,
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              before: 100,
              after: 100,
            },
            style: "normalText",
          }),
          
          // Brand summary
          new Paragraph({
            text: "Распределение по брендам:",
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
                      text: "Бренд",
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
                      text: "Количество",
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
              ...Object.entries(brandSummary).map(([brand, count]) => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        text: brand,
                        alignment: AlignmentType.LEFT,
                        style: "normalText",
                      })]
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        text: count.toString(),
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
          
          // Purpose summary
          new Paragraph({
            text: "Распределение по назначению:",
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
                      text: "Назначение",
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
                      text: "Количество",
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
              ...Object.entries(purposeSummary).map(([purpose, count]) => 
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({
                        text: purpose,
                        alignment: AlignmentType.LEFT,
                        style: "normalText",
                      })]
                    }),
                    new TableCell({
                      children: [new Paragraph({
                        text: count.toString(),
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
                      size: 50,
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
                      size: 50,
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
            text: "Детализация транспортных средств",
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
                  ...(selectedColumns.includes('brand') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Бренд",
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
                  ...(selectedColumns.includes('year') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Год",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('licenseNumber') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Гос. номер",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('purpose') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Назначение",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('fuelType') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Тип топлива",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('transmissionType') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Трансмиссия",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('technicalCondition') ? [
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
                  ...(selectedColumns.includes('lastMaintenance') ? [
                    new TableCell({
                      children: [new Paragraph({
                        text: "Последнее ТО",
                        alignment: AlignmentType.CENTER,
                        style: "tableHeader",
                      })],
                      shading: {
                        fill: "F2F2F2",
                      },
                    })
                  ] : []),
                  ...(selectedColumns.includes('assignedEmployee') ? [
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
                  ] : [])
                ]
              }),
              ...filteredTransport.map(transport => 
                new TableRow({
                  children: [
                    ...(selectedColumns.includes('brand') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: transport.Brand || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('model') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: transport.Model || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('year') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: transport.Year ? transport.Year.toString() : '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('licenseNumber') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: transport.LicenseNumber || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('purpose') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: transport.Purpose || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('fuelType') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: transport.FuelType || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('transmissionType') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: transport.TransmissionType || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('technicalCondition') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: transport.TechnicalCondition || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('lastMaintenance') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: transport.LastMaintenance || '',
                          alignment: AlignmentType.LEFT,
                          style: "normalText",
                        })]
                      })
                    ] : []),
                    ...(selectedColumns.includes('assignedEmployee') ? [
                      new TableCell({
                        children: [new Paragraph({
                          text: transport.assignedEmployee || '',
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
        saveAs(blob, `Отчёт_о_транспорте_${moment().format('YYYY-MM-DD')}.docx`);
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
    { value: 'brand', label: 'Бренд' },
    { value: 'model', label: 'Модель' },
    { value: 'year', label: 'Год выпуска' },
    { value: 'licenseNumber', label: 'Гос. номер' },
    { value: 'purpose', label: 'Назначение' },
    { value: 'fuelType', label: 'Тип топлива' },
    { value: 'transmissionType', label: 'Трансмиссия' },
    { value: 'technicalCondition', label: 'Состояние' },
    { value: 'lastMaintenance', label: 'Последнее ТО' },
    { value: 'assignedEmployee', label: 'Ответственный' }
  ];

  // Handle column selection change
  const handleColumnChange = (checkedValues) => {
    setSelectedColumns(checkedValues);
  };

  return (
    <div className="transport-docx-page">
      <Breadcrumb className="page-breadcrumb">
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/transport">
          Транспорт
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          Формирование отчёта
        </Breadcrumb.Item>
      </Breadcrumb>
      
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/transport')}
          className="back-button"
        >
          Назад к списку транспорта
        </Button>
        <Title level={3} className="transport-docx-title">
          Формирование отчёта по транспорту
        </Title>
        <Button
          className="ant-add-button"
          type="primary"
          onClick={handleDownloadDocx}
          loading={loading}
          icon={<FileWordOutlined />}
          disabled={filteredTransport.length === 0 || (!includeSummary && !includeDetails)}
        >
          Скачать .docx
        </Button>
      </div>
      
      <Spin spinning={initialLoading}>
        <Card className="transport-docx-main-card">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            className="transport-docx-tabs"
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
                className="transport-docx-form"
              >
                <Row gutter={[16, 16]}>
                  {/* Левая колонка с фильтрами */}
                  <Col xs={24} lg={12}>
                    <Card 
                      title="Фильтры" 
                      className="docx-filter-card"
                      bordered={false}
                    >
                      <div className="additional-filters">
                        <Form.Item
                          name="brands"
                          label="Бренды"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все бренды"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.brands}
                            onChange={(values) => handleFilterChange('brands', values)}
                          >
                            {getUniqueBrands().map(brand => (
                              <Option key={brand} value={brand}>
                                {brand}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        
                        <Form.Item
                          name="purposes"
                          label="Назначение"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все назначения"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.purposes}
                            onChange={(values) => handleFilterChange('purposes', values)}
                          >
                            {getUniquePurposes().map(purpose => (
                              <Option key={purpose} value={purpose}>
                                {purpose}
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
                            {getUniqueConditions().map(condition => (
                              <Option key={condition} value={condition}>
                                {condition}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>

                        <Form.Item
                          name="assignedEmployees"
                          label="Ответственные сотрудники"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Все сотрудники"
                            allowClear
                            style={{ width: '100%' }}
                            value={filterValues.assignedEmployees}
                            onChange={(values) => handleFilterChange('assignedEmployees', values)}
                          >
                            {getUniqueAssignedEmployees().map(employee => (
                              <Option key={employee} value={employee}>
                                {employee}
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
                            <b>Включить детализацию транспорта</b>
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
                <Card className="transport-summary-card" bordered={false}>
                  <div className="transport-summary">
                    <div className="transport-count">
                      <Text>Найдено транспортных средств: <b>{filteredTransport.length}</b></Text>
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
                {filteredTransport.length > 0 ? (
                  <>
                    {includeSummary && (
                      <Card 
                        title="Сводная информация" 
                        className="preview-summary-card"
                        bordered={false}
                      >
                        <p className="summary-total">Общее количество транспортных средств: <b>{filteredTransport.length}</b></p>
                        
                        <Row gutter={16}>
                          <Col xs={24} md={8}>
                            <Card title="По брендам" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredTransport.reduce((acc, transport) => {
                                  const brand = transport.Brand || 'Не указано';
                                  acc[brand] = (acc[brand] || 0) + 1;
                                  return acc;
                                }, {})).map(([brand, count]) => ({ brand, count }))}
                                columns={[
                                  { title: 'Бренд', dataIndex: 'brand', key: 'brand' },
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
                          <Col xs={24} md={8}>
                            <Card title="По назначению" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredTransport.reduce((acc, transport) => {
                                  const purpose = transport.Purpose || 'Не указано';
                                  acc[purpose] = (acc[purpose] || 0) + 1;
                                  return acc;
                                }, {})).map(([purpose, count]) => ({ purpose, count }))}
                                columns={[
                                  { title: 'Назначение', dataIndex: 'purpose', key: 'purpose' },
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
                          <Col xs={24} md={8}>
                            <Card title="По состоянию" bordered={false} size="small">
                              <Table
                                dataSource={Object.entries(filteredTransport.reduce((acc, transport) => {
                                  const condition = transport.TechnicalCondition || 'Не указано';
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
                        title="Детализация транспорта" 
                        className="preview-details-card"
                        bordered={false}
                      >
                        <Table
                          dataSource={filteredTransport}
                          columns={[
                            ...(selectedColumns.includes('brand') ? [{
                              title: 'Бренд',
                              dataIndex: 'Brand',
                              key: 'brand'
                            }] : []),
                            ...(selectedColumns.includes('model') ? [{
                              title: 'Модель',
                              dataIndex: 'Model',
                              key: 'model'
                            }] : []),
                            ...(selectedColumns.includes('year') ? [{
                              title: 'Год',
                              dataIndex: 'Year',
                              key: 'year'
                            }] : []),
                            ...(selectedColumns.includes('licenseNumber') ? [{
                              title: 'Гос. номер',
                              dataIndex: 'LicenseNumber',
                              key: 'licenseNumber'
                            }] : []),
                            ...(selectedColumns.includes('purpose') ? [{
                              title: 'Назначение',
                              dataIndex: 'Purpose',
                              key: 'purpose'
                            }] : []),
                            ...(selectedColumns.includes('fuelType') ? [{
                              title: 'Тип топлива',
                              dataIndex: 'FuelType',
                              key: 'fuelType'
                            }] : []),
                            ...(selectedColumns.includes('transmissionType') ? [{
                              title: 'Трансмиссия',
                              dataIndex: 'TransmissionType',
                              key: 'transmissionType'
                            }] : []),
                            ...(selectedColumns.includes('technicalCondition') ? [{
                              title: 'Состояние',
                              dataIndex: 'TechnicalCondition',
                              key: 'technicalCondition'
                            }] : []),
                            ...(selectedColumns.includes('lastMaintenance') ? [{
                              title: 'Последнее ТО',
                              dataIndex: 'LastMaintenance',
                              key: 'lastMaintenance'
                            }] : []),
                            ...(selectedColumns.includes('assignedEmployee') ? [{
                              title: 'Ответственный',
                              dataIndex: 'assignedEmployee',
                              key: 'assignedEmployee'
                            }] : [])
                          ]}
                          rowKey="Transport_ID"
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

export default TransportDocx;