package com.replaymod.core.mixin;

import net.minecraft.client.gui.screen.Screen;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.gen.Accessor;

import java.util.List;

//#if MC>=11400
import net.minecraft.client.gui.widget.AbstractButtonWidget;
//#else
//$$ import net.minecraft.client.gui.GuiButton;
//#endif

//#if MC>=11300
import net.minecraft.client.gui.Element;
//#endif

@Mixin(Screen.class)
public interface GuiScreenAccessor {
    @Accessor
    //#if MC>=11400
    List<AbstractButtonWidget> getButtons();
    //#else
    //$$ List<GuiButton> getButtons();
    //#endif

    //#if MC>=11300
    @Accessor
    List<Element> getChildren();
    //#endif
}
