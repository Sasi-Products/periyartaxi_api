import Sequelize from 'sequelize';
const {Model,DataTypes}=Sequelize;
class StaffDocument extends Model {}
export default sequelize=>{
 StaffDocument.init({
  userId:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  category:{type:DataTypes.ENUM('PHOTO','ID_PROOF','ADDRESS_PROOF','SIGNED_AGREEMENT','BANK_PROOF','QUALIFICATION','OTHER'),allowNull:false},
  originalName:{type:DataTypes.STRING(180),allowNull:false},
  storedName:{type:DataTypes.STRING(100),allowNull:false},
  uploadedBy:{type:DataTypes.INTEGER.UNSIGNED,allowNull:false},
  description:DataTypes.STRING(400)
 },{sequelize,modelName:'StaffDocument',tableName:'staff_documents',indexes:[{fields:['user_id']}]});return StaffDocument;
};
