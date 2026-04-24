import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  actorUserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  actorEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  actorRole: {
    type: DataTypes.STRING,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  targetType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  targetId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  summary: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  timestamps: true
})

export default AuditLog
