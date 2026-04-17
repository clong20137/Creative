import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const CRMLead = sequelize.define('CRMLead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  inquiryType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'quote'
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'quoted', 'won', 'lost', 'archived'),
    allowNull: false,
    defaultValue: 'new'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  serviceTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  budget: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timeline: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferredContact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sourcePage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
})

export default CRMLead
