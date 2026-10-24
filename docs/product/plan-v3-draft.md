# BLE Key Fob Plan V3

Use FCC pre-certified Raytac chips so all we have to do is put contains text on housing/fob. 

High power MDBT50Q-1MV2 in reciever.
Low power compact MDBT42TV-PAT in fob.

Estimated 200 foot working distance.

Both chips use the same JTag development board for for flashing.  

Most modern key fobs use BLE. But most modern fobs also used advanced RF for measuring distance as an additional security measure to support advanced features like auto-unlock that we will not support. 

## Reciever

The reciever board sits in between the OEM Fox mustang door lock circuit. This means it needs to control the locks individually via the fob but also forward the command from the OEM door locks. The door lock circuit grounds on one side and sends 12v on the other so we will use 

Fob flow
- recieves signals over BLE to MDBT50Q-1MV2

Door lock flow
- 

## Component Links

Dev Board (for flashing): https://www.digikey.com/en/products/detail/nordic-semiconductor-asa/NRF5340-DK/13544603
Reciever: https://www.digikey.com/en/products/detail/raytac/MDBT50Q-1MV2/13677591
Fob: https://www.digikey.com/en/products/detail/raytac/MDBT42TV-PAT/18717914
