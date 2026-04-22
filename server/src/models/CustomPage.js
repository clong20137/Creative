import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const CustomPage = sequelize.define('CustomPage', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  headerTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  headerSubtitle: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  showPageHeader: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  sections: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  metaTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metaDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
})

export default CustomPage
