import { DataTypes } from 'sequelize'
import sequelize from '../database.js'

const SiteSetting = sequelize.define('SiteSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    defaultValue: 1
  },
  siteName: {
    type: DataTypes.STRING,
    defaultValue: 'Creative Studio'
  },
  faviconUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    defaultValue: 'hello@creativestudio.com'
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: '+1 (555) 123-4567'
  },
  hours: {
    type: DataTypes.STRING,
    defaultValue: 'Mon-Fri, 9am-6pm EST'
  },
  locationLine1: {
    type: DataTypes.STRING,
    defaultValue: '123 Creative Street'
  },
  locationLine2: {
    type: DataTypes.STRING,
    defaultValue: 'New York, NY 10001'
  },
  footerDescription: {
    type: DataTypes.TEXT,
    defaultValue: 'Transforming ideas into stunning visual experiences through web design, photography, and videography.'
  },
  facebookUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  instagramUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twitterUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkedinUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
})

export default SiteSetting
