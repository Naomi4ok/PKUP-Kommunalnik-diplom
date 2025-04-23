import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Card, Typography, Button, Modal, Form, Input, Select, DatePicker, TimePicker, message, Space, Tooltip, Tabs, Breadcrumb, Row, Col, Spin, Statistic } from 'antd';
import { PlusOutlined, TeamOutlined, ToolOutlined, CarOutlined, FieldTimeOutlined, HomeOutlined, ExperimentOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/ru';
import '../../styles/Schedule/Schedule.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Process status options
const statusOptions = [
  { value: 'scheduled', label: 'Запланировано', color: 'blue' },
  { value: 'in-progress', label: 'В процессе', color: 'orange' },
  { value: 'completed', label: 'Завершено', color: 'green' },
  { value: 'delayed', label: 'Отложено', color: 'red' },
  { value: 'critical', label: 'Критический', color: 'purple' },
];

// Priority options
const priorityOptions = [
  { value: 'low', label: 'Низкий', color: 'green' },
  { value: 'medium', label: 'Средний', color: 'blue' },
  { value: 'high', label: 'Высокий', color: 'orange' },
  { value: 'urgent', label: 'Срочный', color: 'red' },
];

const Schedule = () => {
  // Mock data for employees, equipment, transport, and processes
  // In a real application, these would be fetched from your API
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Иванов Иван', position: 'Оператор' },
    { id: 2, name: 'Петров Петр', position: 'Инженер' },
    { id: 3, name: 'Сидорова Анна', position: 'Техник' },
    { id: 4, name: 'Смирнов Алексей', position: 'Водитель' },
  ]);

  const [equipment, setEquipment] = useState([
    { id: 1, name: 'Фронтальный погрузчик', type: 'Строительное оборудование' },
    { id: 2, name: 'Компрессор', type: 'Пневматическое оборудование' },
    { id: 3, name: 'Генератор', type: 'Электрическое оборудование' },
  ]);

  const [transport, setTransport] = useState([
    { id: 1, name: 'КамАЗ', licenseNumber: 'A123BC' },
    { id: 2, name: 'Газель', licenseNumber: 'B456CD' },
    { id: 3, name: 'Трактор МТЗ', licenseNumber: 'C789DE' },
  ]);

  const [processes, setProcesses] = useState([
    { id: 1, name: 'Обслуживание водопровода', type: 'Водоснабжение' },
    { id: 2, name: 'Ремонт дороги', type: 'Дорожные работы' },
    { id: 3, name: 'Уборка территории', type: 'Благоустройство' },
    { id: 4, name: 'Вывоз мусора', type: 'Санитарное обслуживание' },
  ]);

  // State for all scheduled tasks
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Ремонт водопровода на ул. Ленина',
      date: '2025-04-23',
      startTime: '08:00',
      endTime: '14:00',
      employeeIds: [1, 3],
      equipmentIds: [2],
      transportIds: [1],
      processId: 1,
      location: 'ул. Ленина, 15',
      status: 'in-progress',
      priority: 'high',
      description: 'Устранение прорыва трубопровода холодного водоснабжения',
      progress: 65,
    },
    {
      id: 2,
      title: 'Уборка в парке Горького',
      date: '2025-04-24',
      startTime: '09:00',
      endTime: '15:00',
      employeeIds: [3, 4],
      equipmentIds: [],
      transportIds: [2],
      processId: 3,
      location: 'Парк Горького',
      status: 'scheduled',
      priority: 'medium',
      description: 'Плановая уборка территории парка',
      progress: 0,
    },
    {
      id: 3,
      title: 'Вывоз мусора с контейнерных площадок',
      date: '2025-04-23',
      startTime: '06:00',
      endTime: '12:00',
      employeeIds: [4],
      equipmentIds: [],
      transportIds: [1],
      processId: 4,
      location: 'Район Заречный',
      status: 'completed',
      priority: 'medium',
      description: 'Вывоз ТБО с контейнерных площадок района',
      progress: 100,
    },
    {
      id: 4,
      title: 'Ремонт асфальтового покрытия',
      date: '2025-04-25',
      startTime: '08:00',
      endTime: '17:00',
      employeeIds: [1, 2, 4],
      equipmentIds: [1, 3],
      transportIds: [1, 3],
      processId: 2,
      location: 'ул. Пушкина, 10-24',
      status: 'scheduled',
      priority: 'high',
      description: 'Ямочный ремонт дорожного полотна',
      progress: 0,
    },
    {
      id: 5,
      title: 'Обслуживание канализации',
      date: '2025-04-26',
      startTime: '09:00',
      endTime: '13:00',
      employeeIds: [1, 3],
      equipmentIds: [2],
      transportIds: [2],
      processId: 1,
      location: 'ул. Гагарина, 5',
      status: 'scheduled',
      priority: 'low',
      description: 'Плановая прочистка канализационных колодцев',
      progress: 0,
    },
  ]);

  // State for modal visibility and form
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'

  // Filtered tasks for the selected date (in Day view)
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);

  // Update selectedDateTasks whenever date or tasks change
  useEffect(() => {
    filterTasksByDate(selectedDate);
  }, [selectedDate, tasks]);

  // Filter tasks for the selected date
  const filterTasksByDate = (date) => {
    const filtered = tasks.filter(task => task.date === date);
    setSelectedDateTasks(filtered);
  };

  // Handle date selection in calendar
  const onSelect = (value) => {
    const dateString = value.format('YYYY-MM-DD');
    setSelectedDate(dateString);
  };

  // Get tasks for a specific date (for calendar cell rendering)
  const getListData = (value) => {
    const dateString = value.format('YYYY-MM-DD');
    return tasks.filter(task => task.date === dateString);
  };

  // Render calendar cell data
  const dateCellRender = (value) => {
    const listData = getListData(value);
    
    return (
      <ul className="tasks-list">
        {listData.map(item => (
          <li key={item.id} onClick={() => showTaskDetails(item)}>
            <Badge
              color={statusOptions.find(s => s.value === item.status)?.color || 'blue'}
              text={
                <Tooltip title={item.title}>
                  <span className="task-badge-text">{item.title}</span>
                </Tooltip>
              }
            />
          </li>
        ))}
      </ul>
    );
  };

  // Add a new task
  const showAddTaskModal = () => {
    setIsEditing(false);
    setCurrentTask(null);
    form.resetFields();
    
    // Set default date and times
    form.setFieldsValue({
      date: moment(selectedDate),
      timeRange: [moment('08:00', 'HH:mm'), moment('17:00', 'HH:mm')],
    });
    
    setModalVisible(true);
  };

  // Edit existing task
  const showEditTaskModal = (task) => {
    setIsEditing(true);
    setCurrentTask(task);
    
    form.setFieldsValue({
      title: task.title,
      date: moment(task.date),
      timeRange: [
        moment(task.startTime, 'HH:mm'),
        moment(task.endTime, 'HH:mm')
      ],
      employeeIds: task.employeeIds,
      equipmentIds: task.equipmentIds,
      transportIds: task.transportIds,
      processId: task.processId,
      location: task.location,
      status: task.status,
      priority: task.priority,
      description: task.description,
      progress: task.progress,
    });
    
    setModalVisible(true);
  };

  // Show task details
  const showTaskDetails = (task) => {
    setCurrentTask(task);
    showEditTaskModal(task);
  };

  // Handle form submission
  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        setLoading(true);
        
        setTimeout(() => {
          // Format date and time
          const date = values.date.format('YYYY-MM-DD');
          const startTime = values.timeRange[0].format('HH:mm');
          const endTime = values.timeRange[1].format('HH:mm');
          
          if (isEditing && currentTask) {
            // Update existing task
            const updatedTasks = tasks.map(task => 
              task.id === currentTask.id 
                ? { 
                    ...task, 
                    title: values.title,
                    date,
                    startTime,
                    endTime,
                    employeeIds: values.employeeIds,
                    equipmentIds: values.equipmentIds || [],
                    transportIds: values.transportIds || [],
                    processId: values.processId,
                    location: values.location,
                    status: values.status,
                    priority: values.priority,
                    description: values.description,
                    progress: values.progress || 0,
                  } 
                : task
            );
            setTasks(updatedTasks);
            message.success('Задача обновлена успешно');
          } else {
            // Create new task
            const newTask = {
              id: tasks.length + 1,
              title: values.title,
              date,
              startTime,
              endTime,
              employeeIds: values.employeeIds,
              equipmentIds: values.equipmentIds || [],
              transportIds: values.transportIds || [],
              processId: values.processId,
              location: values.location,
              status: values.status,
              priority: values.priority,
              description: values.description,
              progress: values.progress || 0,
            };
            setTasks([...tasks, newTask]);
            message.success('Задача добавлена успешно');
          }
          
          setLoading(false);
          setModalVisible(false);
        }, 500);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  // Delete a task
  const handleDeleteTask = (taskId) => {
    Modal.confirm({
      title: 'Вы уверены, что хотите удалить эту задачу?',
      icon: <ExclamationCircleOutlined />,
      content: 'Это действие нельзя будет отменить',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk() {
        setTasks(tasks.filter(task => task.id !== taskId));
        setModalVisible(false);
        message.success('Задача удалена успешно');
      },
    });
  };

  // Get name from ID for various entities
  const getEmployeeNames = (ids) => {
    return ids.map(id => employees.find(emp => emp.id === id)?.name || 'Unknown').join(', ');
  };

  const getEquipmentNames = (ids) => {
    return ids.map(id => equipment.find(eq => eq.id === id)?.name || 'Unknown').join(', ');
  };

  const getTransportNames = (ids) => {
    return ids.map(id => transport.find(t => t.id === id)?.name || 'Unknown').join(', ');
  };

  const getProcessName = (id) => {
    return processes.find(p => p.id === id)?.name || 'Unknown';
  };

  // Calculate schedule statistics
  const statisticsData = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(task => task.status === 'completed').length,
    inProgressTasks: tasks.filter(task => task.status === 'in-progress').length,
    scheduledTasks: tasks.filter(task => task.status === 'scheduled').length,
    delayedTasks: tasks.filter(task => task.status === 'delayed').length,
    criticalTasks: tasks.filter(task => task.status === 'critical').length,
    todayTasks: tasks.filter(task => task.date === moment().format('YYYY-MM-DD')).length,
    tomorrowTasks: tasks.filter(task => task.date === moment().add(1, 'days').format('YYYY-MM-DD')).length,
  };

  return (
    <div className="schedule-container">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="breadcrumb-navigation">
        <Breadcrumb.Item>
          <a href="/"><HomeOutlined /> Главная</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Расписание</Breadcrumb.Item>
      </Breadcrumb>

      {/* Page Header */}
      <div className="schedule-header">
        <div>
          <Title level={2}>Расписание производственных процессов</Title>
          <Text type="secondary">Управление и мониторинг рабочих задач и ресурсов</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={showAddTaskModal}
          size="large"
        >
          Новая задача
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="statistics-row">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="statistic-card">
            <Statistic 
              title="Всего задач" 
              value={statisticsData.totalTasks} 
              prefix={<InfoCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="statistic-card completed">
            <Statistic 
              title="Выполнено" 
              value={statisticsData.completedTasks} 
              prefix={<CheckCircleOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="statistic-card in-progress">
            <Statistic 
              title="В процессе" 
              value={statisticsData.inProgressTasks} 
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card className="statistic-card critical-delayed">
            <Statistic 
              title="Критические/Отложенные" 
              value={statisticsData.criticalTasks + statisticsData.delayedTasks} 
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for different views */}
      <Tabs 
        defaultActiveKey="month" 
        onChange={setViewMode}
        className="schedule-tabs"
      >
        <TabPane tab="Месяц" key="month">
          <Card className="calendar-card">
            <Calendar 
              dateCellRender={dateCellRender} 
              onSelect={onSelect}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="День" key="day">
          <Card className="day-view-card">
            <div className="day-header">
              <Title level={4}>
                {moment(selectedDate).format('DD MMMM YYYY')}
              </Title>
              <Space>
                <Button 
                  onClick={() => setSelectedDate(moment(selectedDate).subtract(1, 'days').format('YYYY-MM-DD'))}
                >
                  Предыдущий день
                </Button>
                <Button
                  onClick={() => setSelectedDate(moment().format('YYYY-MM-DD'))}
                >
                  Сегодня
                </Button>
                <Button
                  onClick={() => setSelectedDate(moment(selectedDate).add(1, 'days').format('YYYY-MM-DD'))}
                >
                  Следующий день
                </Button>
              </Space>
            </div>
            
            {selectedDateTasks.length > 0 ? (
              <div className="day-tasks">
                {selectedDateTasks.map(task => (
                  <Card 
                    key={task.id} 
                    className={`task-card ${task.status}`}
                    onClick={() => showTaskDetails(task)}
                  >
                    <div className="task-card-header">
                      <Text strong>{task.title}</Text>
                      <Badge 
                        status={statusOptions.find(s => s.value === task.status)?.color} 
                        text={statusOptions.find(s => s.value === task.status)?.label} 
                      />
                    </div>
                    
                    <div className="task-card-time">
                      <FieldTimeOutlined /> {task.startTime} - {task.endTime}
                    </div>
                    
                    <div className="task-card-location">
                      <HomeOutlined /> {task.location}
                    </div>
                    
                    <div className="task-card-process">
                      <ExperimentOutlined /> {getProcessName(task.processId)}
                    </div>
                    
                    <div className="task-card-resources">
                      <div>
                        <TeamOutlined /> {getEmployeeNames(task.employeeIds)}
                      </div>
                      
                      {task.equipmentIds.length > 0 && (
                        <div>
                          <ToolOutlined /> {getEquipmentNames(task.equipmentIds)}
                        </div>
                      )}
                      
                      {task.transportIds.length > 0 && (
                        <div>
                          <CarOutlined /> {getTransportNames(task.transportIds)}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="no-tasks">
                <Title level={4}>Нет задач на выбранную дату</Title>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={showAddTaskModal}
                >
                  Добавить задачу
                </Button>
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>

      {/* Task Form Modal */}
      <Modal
        title={isEditing ? "Редактировать задачу" : "Добавить новую задачу"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          isEditing && (
            <Button 
              key="delete" 
              danger 
              onClick={() => handleDeleteTask(currentTask.id)}
            >
              Удалить
            </Button>
          ),
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Отмена
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={loading} 
            onClick={handleSubmit}
          >
            {isEditing ? "Сохранить" : "Добавить"}
          </Button>,
        ]}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          className="task-form"
          initialValues={{
            status: 'scheduled',
            priority: 'medium',
            progress: 0,
          }}
        >
          <Form.Item
            name="title"
            label="Название задачи"
            rules={[{ required: true, message: 'Пожалуйста, введите название задачи' }]}
          >
            <Input placeholder="Введите название задачи" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Дата"
                rules={[{ required: true, message: 'Выберите дату' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeRange"
                label="Время начала и окончания"
                rules={[{ required: true, message: 'Выберите время' }]}
              >
                <TimePicker.RangePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="processId"
                label="Производственный процесс"
                rules={[{ required: true, message: 'Выберите процесс' }]}
              >
                <Select placeholder="Выберите процесс">
                  {processes.map(process => (
                    <Option key={process.id} value={process.id}>
                      {process.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Место проведения"
                rules={[{ required: true, message: 'Укажите место проведения' }]}
              >
                <Input placeholder="Адрес или название объекта" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Статус"
                rules={[{ required: true, message: 'Выберите статус' }]}
              >
                <Select placeholder="Выберите статус">
                  {statusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Badge color={option.color} text={option.label} />
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Приоритет"
                rules={[{ required: true, message: 'Выберите приоритет' }]}
              >
                <Select placeholder="Выберите приоритет">
                  {priorityOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      <Badge color={option.color} text={option.label} />
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="employeeIds"
            label="Ответственные сотрудники"
            rules={[{ required: true, message: 'Выберите хотя бы одного сотрудника' }]}
          >
            <Select 
              mode="multiple" 
              placeholder="Выберите сотрудников"
              optionFilterProp="children"
            >
              {employees.map(employee => (
                <Option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.position})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="equipmentIds"
                label="Используемое оборудование"
              >
                <Select 
                  mode="multiple" 
                  placeholder="Выберите оборудование"
                  optionFilterProp="children"
                >
                  {equipment.map(item => (
                    <Option key={item.id} value={item.id}>
                      {item.name} ({item.type})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="transportIds"
                label="Используемый транспорт"
              >
                <Select 
                  mode="multiple" 
                  placeholder="Выберите транспорт"
                  optionFilterProp="children"
                >
                  {transport.map(item => (
                    <Option key={item.id} value={item.id}>
                      {item.name} ({item.licenseNumber})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {(form.getFieldValue('status') === 'in-progress' || 
           form.getFieldValue('status') === 'completed') && (
            <Form.Item
              name="progress"
              label="Прогресс выполнения (%)"
            >
              <Select>
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(value => (
                  <Option key={value} value={value}>
                    {value}%
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="description"
            label="Описание задачи"
          >
            <Input.TextArea 
              rows={4}
              placeholder="Подробное описание задачи"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Schedule;