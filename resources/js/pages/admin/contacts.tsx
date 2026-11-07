import { Pagination } from '../../components/admin-fields';
import AdminLayout from '../../layouts/admin-layout';
import type { Page } from '../../types/admin';

export default function Contacts({messages}:{messages:Page<{id:number;name:string;email:string;message:string;created_at:string}>}) {
    return <AdminLayout title="Contact messages"><p className="policy-disclaimer">Submitted demo messages, visible only to staff. This project does not send replies or email.</p><p className="admin-note">{messages.total} messages</p>{messages.data.map(message=><article className="admin-panel" key={message.id}><h2>{message.name}</h2><p>{message.email} · <time dateTime={message.created_at}>{message.created_at.slice(0,10)}</time></p><p className="preserve-lines">{message.message}</p></article>)}{!messages.data.length&&<p className="empty-state">No demo contact messages yet.</p>}<Pagination page={messages}/></AdminLayout>;
}
