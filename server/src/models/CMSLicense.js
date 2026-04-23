import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const CMSLicense = sequelize.define('CMSLicense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'SubscriptionPlans',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  planName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tier: {
    type: DataTypes.ENUM('starter', 'professional', 'enterprise'),
    allowNull: false,
    defaultValue: 'starter'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'active'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'quarterly', 'annually'),
    allowNull: false,
    defaultValue: 'monthly'
  },
  licenseKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  licensedDomain: {
    type: DataTypes.STRING,
    allowNull: true
  },
  updateChannel: {
    type: DataTypes.ENUM('stable', 'early-access'),
    allowNull: false,
    defaultValue: 'stable'
  },
  includedUpdates: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  renewalDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastValidatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
})

export default CMSLicense
