import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tier: {
    type: DataTypes.ENUM('starter', 'professional', 'enterprise'),
    defaultValue: 'starter'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'quarterly', 'annually'),
    defaultValue: 'monthly'
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
})

export default SubscriptionPlan
