const step=(id,type,title,body,choices=[])=>({id,type,title,body,image:'',alt:'',choices:choices.map(([label,to])=>({label,to}))});
export const examples=[
 {schema:'relay-guide/1',id:'projector',title:'Get the projector working',description:'A sample handoff for the person presenting after you. Adapt the inputs and equipment names to your room.',start:'connect',steps:[
 step('connect','action','Connect your laptop','Plug the room’s display cable into your laptop. If your laptop needs an adapter, connect that first. Switch on the projector using its remote.',[['Connected','screen']]),
 step('screen','decision','Can you see your laptop screen?','Look at the projected image, not the laptop. A blue screen or “No signal” means the connection is not ready.',[['Yes, I see it','ready'],['No, the screen is blank','input']]),
 step('input','action','Match the input','On the remote, select Input or Source. Match it to the socket your cable is plugged into (for example, HDMI 1). Wait a few seconds.',[['Input selected','check']]),
 step('check','decision','Is the picture showing now?','If the projector is still blank, leave a note with the input you tried so the next person has a starting point.',[['Yes, it is','ready'],['Still blank','help']]),
 step('ready','end','You’re ready to present','Open your slides. Check that the projected text is readable from the back of the room. Your walkthrough is complete.'),
 step('help','end','Hand over the problem','Ask the room or equipment owner for help. Tell them which cable and input you tried. This path ends here; it does not mark the equipment as fixed.') ]},
 {schema:'relay-guide/1',id:'room',title:'Close the shared studio',description:'An editable example for a student club or shared workspace. Replace these steps with your space’s agreed routine.',start:'clear',steps:[
 step('clear','action','Reset the work tables','Return shared supplies to their labelled places. Clear your own materials and leave the next person a usable surface.',[['Tables are clear','items']]),
 step('items','decision','Anything left behind?','Check the tables and chairs for someone else’s belongings.',[['Yes, I found something','lost'],['Nothing left','lights']]),
 step('lost','action','Leave it in the agreed place','Use your group’s lost-property location. Add a note describing the item without personal information.',[['Stored safely','lights']]),
 step('lights','action','Follow the room’s closing checklist','Use the posted instructions for lights, windows, and the door. Do not switch off equipment that is marked to stay on.',[['Room checked','done']]),
 step('done','end','Ready for the next group','Leave any unresolved issue in your notes. Download your walkthrough record if your group uses one.') ]},
 {schema:'relay-guide/1',id:'handoff',title:'Hand over a recurring task',description:'A starting point for passing a club role or team responsibility to someone new.',start:'goal',steps:[
 step('goal','action','Show what “done” looks like','Write the expected outcome here. Add an example image if it helps the next person recognize a good result.',[['I understand the outcome','access']]),
 step('access','decision','Do you have what you need?','List the files, equipment, and contacts needed for the task. Do not put passwords or access codes in this guide.',[['Yes, everything is available','try'],['Something is missing','missing']]),
 step('missing','end','Ask the task owner','Describe what is missing in your notes. Resume with the task owner when the required materials are available.'),
 step('try','action','Try it once together','Replace this step with the actual first action. Let the new person do it, then note what the instructions leave unclear.',[['First run finished','done']]),
 step('done','end','Make the handoff yours','Update this guide with what you learned. Save a backup and share the offline guide with the next person.') ]}
];
export function blankGuide(){return {schema:'relay-guide/1',id:crypto.randomUUID(),title:'My new guide',description:'',start:'first',steps:[step('first','action','Start here','Describe the first action.',[['Done','finish']]),step('finish','end','All done','Describe the expected result.')]};}
