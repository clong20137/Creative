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
  productType: {
    type: DataTypes.ENUM('service', 'cms-license'),
    allowNull: false,
    defaultValue: 'service'
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
  maxPages: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  maxMediaItems: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  maxStorageMb: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  maxTeamMembers: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  allowAllPlugins: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  allowedPluginSlugs: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  whiteLabelEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  backupsEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  auditLogEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  customDomainEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
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
