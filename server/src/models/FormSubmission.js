import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const FormSubmission = sequelize.define('FormSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  formName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pagePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pageTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fields: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('new', 'read', 'archived'),
    defaultValue: 'new'
  }
}, {
  timestamps: true
})

export default FormSubmission
