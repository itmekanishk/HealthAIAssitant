import React from 'react';
import { Phone, Ambulance, Building2 } from 'lucide-react';
import { PageContainer } from './ui/PageContainer';
function EmergencyContact({ icon, title, contact, description }) {
    return (<div className="bg-card/70 border border-border/60 rounded-2xl p-4 flex items-start space-x-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex-shrink-0">
        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="text-xl font-bold text-red-600 dark:text-red-400 my-1">{contact}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>);
}
export default function Emergency() {
    const emergencyContacts = [
        {
            icon: <Phone className="w-6 h-6 text-red-600 dark:text-red-400"/>,
            title: "Emergency Services",
            contact: "112",
            description: "National Emergency Number for immediate police, medical, or fire emergency assistance"
        },
        {
            icon: <Ambulance className="w-6 h-6 text-red-600 dark:text-red-400"/>,
            title: "Ambulance",
            contact: "102 & 108",
            description: "24/7 Ambulance services for medical emergencies"
        },
        {
            icon: <Building2 className="w-6 h-6 text-red-600 dark:text-red-400"/>,
            title: "Women Helpline",
            contact: "1091",
            description: "24/7 Women's emergency helpline for immediate assistance"
        }
    ];
    return (<PageContainer icon={<Phone className="w-6 h-6 text-red-500"/>} title="Emergency Contacts" description="Important emergency numbers in India. Save these for quick access.">
      <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/20">
        <div className="text-center mb-6">
          <p className="text-muted-foreground">If this is a medical emergency, contact emergency services immediately.</p>
        </div>

        <div className="space-y-4">
          {emergencyContacts.map((contact, index) => (<EmergencyContact key={index} icon={contact.icon} title={contact.title} contact={contact.contact} description={contact.description}/>))}
        </div>

        <div className="mt-6 bg-card/70 border border-border/60 rounded-2xl p-4">
          <h3 className="text-lg font-medium text-foreground mb-2">Important Notes</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>These emergency numbers are toll-free and work across India</li>
            <li>Keep your location details ready when calling emergency services</li>
            <li>Stay calm and provide clear information to emergency responders</li>
            <li>Consider saving these numbers on speed dial</li>
          </ul>
        </div>
      </div>
    </PageContainer>);
}
