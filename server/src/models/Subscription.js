import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const Subscription = sequelize.define('Subscription', {
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
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'suspended', 'expired'),
    defaultValue: 'active'
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
  licenseKey: {
    type: DataTypes.STRING,
    allowNull: true
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
  lastValidatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
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
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: true
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
})

export default Subscription
