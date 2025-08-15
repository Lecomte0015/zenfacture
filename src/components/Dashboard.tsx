@@ .. @@
-const Dashboard: React.FC = () => {
+export const Dashboard: React.FC = () => {
   const [currentUser] = useState({
     prenom: 'Utilisateur',
     nom: 'Test'
@@ .. @@
   );
 };
 
-export default Dashboard;